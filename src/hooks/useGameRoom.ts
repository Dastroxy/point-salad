import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, update, get, remove } from 'firebase/database';
import { db } from '../firebase';
import type { GameRoom, Player, Card } from '../types/game';
import {
  buildDeck, splitIntoPiles, dealMarket, refillMarket,
  marketToFirebase, firebaseToMarket,
  pilesToFirebase, firebaseToPiles,
} from '../lib/deck';

function getSessionId(): string {
  let sid = sessionStorage.getItem('ps_session_id');
  if (!sid) {
    sid = 'p_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now();
    sessionStorage.setItem('ps_session_id', sid);
  }
  return sid;
}

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function useGameRoom() {
  const sessionId = useRef(getSessionId()).current;
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsub = onValue(roomRef, snap => {
      const data = snap.val();
      if (data) setRoom(data as GameRoom);
    }, (err) => {
      console.error('Room listener error:', err);
      setError('Lost connection. Check Firebase config.');
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !sessionId) return;
    const connRef = ref(db, `rooms/${roomId}/players/${sessionId}/isConnected`);
    set(connRef, true);
    return () => { set(connRef, false); };
  }, [roomId, sessionId]);

  const createRoom = useCallback(async (name: string) => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    setLoading(true);
    setError('');
    try {
      const code = generateRoomCode();
      const player: Player = {
        id: sessionId, name: name.trim(), sessionId,
        cards: [], isHost: true, isConnected: true,
      };
      const newRoom: GameRoom = {
        id: code, hostId: sessionId, phase: 'lobby',
        players: { [sessionId]: player },
        playerOrder: [sessionId],
        currentTurnIndex: 0,
        drawPiles: { p0: [], p1: [], p2: [] },
        market: {
          '0_0': null, '0_1': null,
          '1_0': null, '1_1': null,
          '2_0': null, '2_1': null,
        },
        turnAction: 'idle',
        createdAt: Date.now(),
        selectedMarketCards: [],
        hasFlippedThisTurn: false,
      };
      await set(ref(db, `rooms/${code}`), newRoom);
      setPlayerName(name.trim());
      setRoomId(code);
    } catch (err: any) {
      console.error('createRoom failed:', err);
      setError(err?.message ?? 'Failed to create room. Check your .env and Firebase config.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const joinRoom = useCallback(async (code: string, name: string) => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!code.trim()) { setError('Please enter a room code.'); return; }
    setLoading(true);
    setError('');
    try {
      const upperCode = code.trim().toUpperCase();
      const snap = await get(ref(db, `rooms/${upperCode}`));
      if (!snap.exists()) { setError('Room not found!'); return; }
      const r = snap.val() as GameRoom;
      if (r.phase !== 'lobby') { setError('Game already started!'); return; }
      const currentPlayers = Object.keys(r.players || {});
      if (currentPlayers.length >= 6) { setError('Room is full!'); return; }
      if (currentPlayers.includes(sessionId)) {
        setPlayerName(name.trim());
        setRoomId(upperCode);
        return;
      }
      const player: Player = {
        id: sessionId, name: name.trim(), sessionId,
        cards: [], isHost: false, isConnected: true,
      };
      await update(ref(db, `rooms/${upperCode}`), {
        [`players/${sessionId}`]: player,
        playerOrder: [...(r.playerOrder || []), sessionId],
      });
      setPlayerName(name.trim());
      setRoomId(upperCode);
    } catch (err: any) {
      console.error('joinRoom failed:', err);
      setError(err?.message ?? 'Failed to join room.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const startGame = useCallback(async () => {
    if (!room || !roomId) return;
    const playerCount = Object.keys(room.players || {}).length;
    if (playerCount < 2) { setError('Need at least 2 players!'); return; }
    setError('');
    try {
      const deck = buildDeck(playerCount);
      const piles = splitIntoPiles(deck);
      const { piles: newPiles, market } = dealMarket(piles);
      const players = { ...room.players };
      for (const sid of Object.keys(players)) {
        players[sid] = { ...players[sid], cards: [] };
      }
      const shuffledOrder = [...room.playerOrder].sort(() => Math.random() - 0.5);
      await update(ref(db, `rooms/${roomId}`), {
        phase: 'playing',
        drawPiles: pilesToFirebase(newPiles),
        market: marketToFirebase(market),
        players,
        playerOrder: shuffledOrder,
        currentTurnIndex: 0,
        turnAction: 'idle',
        selectedMarketCards: [],
        hasFlippedThisTurn: false,
      });
    } catch (err: any) {
      console.error('startGame failed:', err);
      setError(err?.message ?? 'Failed to start game.');
    }
  }, [room, roomId]);

  const draftPointCard = useCallback(async (pileIndex: number) => {
    if (!room || !roomId) return;
    const currentSid = room.playerOrder[room.currentTurnIndex];
    if (currentSid !== sessionId) return;

    const piles = firebaseToPiles(room.drawPiles as any);
    const market = firebaseToMarket(room.market as any);
    if (!piles[pileIndex] || piles[pileIndex].length === 0) return;

    try {
      const card = { ...piles[pileIndex][0], isFaceUp: true };
      piles[pileIndex] = piles[pileIndex].slice(1);

      const updatedPlayers = { ...room.players };
      updatedPlayers[sessionId] = {
        ...updatedPlayers[sessionId],
        cards: [...(updatedPlayers[sessionId].cards || []), card],
      };

      const { piles: refilled, market: newMarket } = refillMarket(piles, market);
      const nextIndex = (room.currentTurnIndex + 1) % room.playerOrder.length;
      const isGameOver =
        refilled.every((p: Card[]) => p.length === 0) &&
        newMarket.every((col: (Card | null)[]) => col.every((c: Card | null) => c === null));

      await update(ref(db, `rooms/${roomId}`), {
        drawPiles: pilesToFirebase(refilled),
        market: marketToFirebase(newMarket),
        players: updatedPlayers,
        currentTurnIndex: nextIndex,
        phase: isGameOver ? 'results' : 'playing',
        selectedMarketCards: [],
        hasFlippedThisTurn: false,
      });
    } catch (err: any) {
      console.error('draftPointCard failed:', err);
      setError(err?.message ?? 'Failed to draft card.');
    }
  }, [room, roomId, sessionId]);

  const setMarketSelection = useCallback(async (keys: string[]) => {
    if (!roomId) return;
    try {
      await update(ref(db, `rooms/${roomId}`), { selectedMarketCards: keys });
    } catch (err: any) {
      console.error('setMarketSelection failed:', err);
    }
  }, [roomId]);

  const confirmMarketDraft = useCallback(async (keys: string[]) => {
    if (!room || !roomId) return;
    const currentSid = room.playerOrder[room.currentTurnIndex];
    if (currentSid !== sessionId) return;
    if (keys.length === 0) return;

    try {
      const market = firebaseToMarket(room.market as any);
      const piles = firebaseToPiles(room.drawPiles as any);
      const updatedPlayers = { ...room.players };

      for (const key of keys) {
        const [c, r] = key.split('-').map(Number);
        const drafted = market[c]?.[r];
        if (drafted) {
          updatedPlayers[sessionId] = {
            ...updatedPlayers[sessionId],
            cards: [
              ...(updatedPlayers[sessionId].cards || []),
              { ...drafted, isFaceUp: false },
            ],
          };
          market[c][r] = null;
        }
      }

      const { piles: refilled, market: filledMarket } = refillMarket(piles, market);
      const nextIndex = (room.currentTurnIndex + 1) % room.playerOrder.length;
      const allPilesEmpty = refilled.every((p: Card[]) => p.length === 0);
      const marketEmpty = filledMarket.every(
        (col: (Card | null)[]) => col.every((c: Card | null) => c === null)
      );
      const isGameOver = allPilesEmpty && marketEmpty;

      await update(ref(db, `rooms/${roomId}`), {
        drawPiles: pilesToFirebase(refilled),
        market: marketToFirebase(filledMarket),
        players: updatedPlayers,
        currentTurnIndex: nextIndex,
        phase: isGameOver ? 'results' : 'playing',
        selectedMarketCards: [],
        hasFlippedThisTurn: false,
      });
    } catch (err: any) {
      console.error('confirmMarketDraft failed:', err);
      setError(err?.message ?? 'Failed to draft cards.');
    }
  }, [room, roomId, sessionId]);

  const flipCardToVeggie = useCallback(async (cardId: number) => {
    if (!room || !roomId) return;
    const currentSid = room.playerOrder[room.currentTurnIndex];
    if (currentSid !== sessionId) return;
    if (room.hasFlippedThisTurn) return;
    try {
      const updatedCards = (room.players[sessionId].cards || []).map((c: Card) =>
        c.id === cardId && c.isFaceUp ? { ...c, isFaceUp: false } : c
      );
      await update(ref(db, `rooms/${roomId}/players/${sessionId}`), { cards: updatedCards });
      await update(ref(db, `rooms/${roomId}`), { hasFlippedThisTurn: true });
    } catch (err: any) {
      console.error('flipCardToVeggie failed:', err);
    }
  }, [room, roomId, sessionId]);

  const leaveRoom = useCallback(async () => {
    if (!roomId || !room) return;
    try {
      if (room.hostId === sessionId) {
        await remove(ref(db, `rooms/${roomId}`));
      } else {
        const newOrder = (room.playerOrder || []).filter((s: string) => s !== sessionId);
        await update(ref(db, `rooms/${roomId}`), {
          [`players/${sessionId}`]: null,
          playerOrder: newOrder,
        });
      }
    } catch (err: any) {
      console.error('leaveRoom failed:', err);
    } finally {
      setRoomId(null);
      setRoom(null);
      setError('');
    }
  }, [roomId, room, sessionId]);

  const resetToLobby = useCallback(async () => {
    if (!room || !roomId) return;
    if (room.hostId !== sessionId) return;
    try {
      const resetPlayers = { ...room.players };
      for (const sid of Object.keys(resetPlayers)) {
        resetPlayers[sid] = { ...resetPlayers[sid], cards: [] };
      }
      await update(ref(db, `rooms/${roomId}`), {
        phase: 'lobby',
        players: resetPlayers,
        drawPiles: { p0: [], p1: [], p2: [] },
        market: {
          '0_0': null, '0_1': null,
          '1_0': null, '1_1': null,
          '2_0': null, '2_1': null,
        },
        currentTurnIndex: 0,
        turnAction: 'idle',
        selectedMarketCards: [],
        hasFlippedThisTurn: false,
      });
    } catch (err: any) {
      console.error('resetToLobby failed:', err);
      setError(err?.message ?? 'Failed to reset game.');
    }
  }, [room, roomId, sessionId]);

  const marketArray = room?.market
    ? firebaseToMarket(room.market as any)
    : [[null, null], [null, null], [null, null]];

  const pilesArray = room?.drawPiles
    ? firebaseToPiles(room.drawPiles as any)
    : [[], [], []];

  return {
    sessionId, room, roomId, playerName, error, loading,
    marketArray, pilesArray,
    createRoom, joinRoom, startGame,
    draftPointCard,
    setMarketSelection,
    confirmMarketDraft,
    flipCardToVeggie,
    leaveRoom,
    resetToLobby,
  };
}
