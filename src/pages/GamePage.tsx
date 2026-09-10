import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { useGameRoom } from '../hooks/useGameRoom';
import type { Card, Player, VeggieType } from '../types/game';
import { calculateTotalScore, getVeggieCounts, scorePointCard } from '../lib/scoring';

type Props = { game: ReturnType<typeof useGameRoom> };

const VEGGIE_EMOJI: Record<string, string> = {
  carrot: '🥕', pepper: '🫑', tomato: '🍅',
  lettuce: '🥬', onion: '🧅', cabbage: '🥦',
};

const VEGGIE_COLOR: Record<string, string> = {
  carrot: 'bg-orange-500',
  pepper: 'bg-rose-500',
  tomato: 'bg-red-600',
  lettuce: 'bg-emerald-600',
  onion: 'bg-purple-600',
  cabbage: 'bg-sky-500',
};

const VEGGIE_BG: Record<string, string> = {
  carrot: '#f4845f',
  pepper: '#e63946',
  tomato: '#c1121f',
  lettuce: '#4a7c59',
  onion: '#9b59b6',
  cabbage: '#4a9aba',
};

const AVATARS = ['🥕', '🫑', '🍅', '🥬', '🧅', '🥦'];

function safeCards(cards: Card[] | Record<string, Card> | null | undefined): Card[] {
  if (!cards) return [];
  if (Array.isArray(cards)) return cards;
  return Object.values(cards);
}

// ─── Point Card Parsing ───────────────────────────────────────────────────────

function parsePointCard(pointText: string, veggie: string): {
  pts: string;
  label: string;
  veggies: string[];
  negative: string[];
  mode: 'combo' | 'single' | 'special';
} {
  const text = pointText.toLowerCase();
  const allVeggies = ['carrot', 'pepper', 'tomato', 'lettuce', 'onion', 'cabbage'];

  const ptsMatch = text.match(/([+-]?\d+)\s*(?:pts?|points?)/);
  const pts = ptsMatch ? ptsMatch[1] : '?';

  const mentioned = allVeggies.filter(v => text.includes(v));
  const negative = mentioned.filter(v => {
    const idx = text.indexOf(v);
    const before = text.slice(Math.max(0, idx - 5), idx);
    return before.includes('-');
  });
  const positive = mentioned.filter(v => !negative.includes(v));

  if (
    text.includes('most') || text.includes('fewest') ||
    text.includes('even') || text.includes('odd') ||
    text.includes('type') ||
    text.includes('none of') || text.includes('total')
  ) {
    const allMentioned = mentioned.length > 0 ? mentioned : [veggie];
    return { pts, label: pointText, veggies: allMentioned, negative: [], mode: 'special' };
  }

  if (text.includes('set of all')) {
    return { pts, label: pointText, veggies: allVeggies, negative: [], mode: 'special' };
  }

  if (positive.length >= 2 || (positive.length >= 1 && negative.length >= 1)) {
    return { pts, label: pointText, veggies: positive, negative, mode: 'combo' };
  }

  return { pts, label: pointText, veggies: positive.length > 0 ? positive : [veggie], negative, mode: 'single' };
}

function wrapText(text: string, maxChars = 14): string[] {
  const plusMatch = text.match(/^(.+?\bper\b\s*)([A-Za-z]+(?:\+[A-Za-z]+)+)(.*)$/i);
  if (plusMatch) {
    const prefix = plusMatch[1].trim();
    const combo = plusMatch[2];
    const suffix = plusMatch[3].trim();
    const parts = combo.split('+');
    const lines: string[] = [];
    if (parts.length >= 2) {
      lines.push(`${prefix} ${parts[0]}+${parts[1]}`);
    } else {
      lines.push(`${prefix} ${parts[0]}`);
    }
    for (let i = 2; i < parts.length; i++) {
      lines.push(`+${parts[i]}`);
    }
    if (suffix) lines.push(suffix);
    return lines;
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Point Card Inner Layout ──────────────────────────────────────────────────

function PointCardInner({ card, small, livePts }: { card: Card; small?: boolean; livePts?: number }) {
  const { veggies, negative } = parsePointCard(card.pointText, card.veggie);
  const lines = wrapText(card.pointText, small ? 11 : 14);
  const veggieBgColor = VEGGIE_BG[card.veggie] ?? '#8bc34a';

  return (
    <div className="bg-[#fef9ef] w-full h-full rounded-xl flex flex-col justify-between overflow-hidden shadow-inner border border-amber-900/15 relative">
      {/* Top Header: Seal Veggie Icon + Optional Live Score Pill */}
      <div
        className="flex items-center justify-between px-2 pt-1.5 pb-1 flex-shrink-0"
        style={{ background: `${veggieBgColor}18` }}
      >
        <div
          className="rounded-full flex items-center justify-center shadow-xs border border-white/60"
          style={{
            background: veggieBgColor,
            width: small ? 20 : 26,
            height: small ? 20 : 26,
          }}
        >
          <span style={{ fontSize: small ? 11 : 14 }}>{VEGGIE_EMOJI[card.veggie]}</span>
        </div>

        {livePts !== undefined && (
          <span className="text-[10px] font-black tracking-tight px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 font-mono border border-amber-500/30">
            {livePts > 0 ? `+${livePts}` : livePts} pts
          </span>
        )}
      </div>

      <div className="h-px mx-1.5 opacity-30" style={{ background: veggieBgColor }} />

      {/* Middle Text: Balanced Baloo 2 font */}
      <div className="flex-1 flex flex-col items-center justify-center px-1.5 py-1">
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-stone-900 font-bold text-center leading-tight w-full"
            style={{
              fontFamily: '"Baloo 2", cursive',
              fontSize: small ? 9 : 11,
              lineHeight: 1.25,
            }}
          >
            {line}
          </p>
        ))}
      </div>

      <div className="h-px mx-1.5 opacity-30" style={{ background: veggieBgColor }} />

      {/* Bottom Icons */}
      <div className="flex items-center justify-center gap-1 py-1 px-1 flex-shrink-0 flex-wrap bg-stone-100/60">
        {veggies.map((v, i) => (
          <span key={i} style={{ fontSize: small ? 10 : 13 }} title={v}>
            {VEGGIE_EMOJI[v]}
          </span>
        ))}
        {negative.map((v, i) => (
          <span
            key={`neg-${i}`}
            style={{ fontSize: small ? 10 : 13 }}
            className="opacity-50 line-through filter grayscale"
            title={`-${v}`}
          >
            {VEGGIE_EMOJI[v]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Card Component ───────────────────────────────────────────────────────────

interface VeggieCardProps {
  card: Card;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  small?: boolean;
  livePts?: number;
}

function VeggieCard({ card, selectable, selected, onSelect, small, livePts }: VeggieCardProps) {
  const sizeClass = small
    ? 'w-[76px] h-[108px] sm:w-[84px] sm:h-[118px]'
    : 'w-[92px] h-[132px] sm:w-[106px] sm:h-[150px]';

  if (!card.isFaceUp) {
    return (
      <motion.div
        layout
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={selectable ? { scale: 0.94 } : {}}
        onClick={onSelect}
        className={`
          relative rounded-xl select-none overflow-hidden shadow-md flex-shrink-0
          transition-all duration-200 ${sizeClass}
          ${selectable ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
          ${selected ? 'ring-4 ring-salad-lime ring-offset-2 ring-offset-salad-dark scale-105 shadow-xl' : ''}
        `}
      >
        <div className={`${VEGGIE_COLOR[card.veggie]} w-full h-full flex flex-col items-center justify-center p-2 gap-1 border-2 border-white/20 shadow-inner`}>
          <span className={small ? 'text-3xl' : 'text-4xl sm:text-5xl'} role="img" aria-label={card.veggie}>
            {VEGGIE_EMOJI[card.veggie]}
          </span>
          <span className="text-white text-[11px] sm:text-xs font-black tracking-wider uppercase drop-shadow-xs">
            {card.veggie}
          </span>
        </div>

        {selected && (
          <div className="absolute top-1.5 right-1.5 bg-salad-lime text-salad-dark w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow">
            ✓
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={selectable ? { scale: 0.94 } : {}}
      onClick={onSelect}
      className={`
        relative rounded-xl select-none overflow-hidden shadow-md flex-shrink-0
        transition-all duration-200 ${sizeClass}
        ${selectable ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
        ${selected ? 'ring-4 ring-salad-lime ring-offset-2 ring-offset-salad-dark scale-105 shadow-xl' : ''}
      `}
    >
      <PointCardInner card={card} small={small} livePts={livePts} />
      {selected && (
        <div className="absolute top-1.5 right-1.5 bg-salad-lime text-salad-dark w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow z-10">
          ✓
        </div>
      )}
    </motion.div>
  );
}

// ─── Opponent Panel ───────────────────────────────────────────────────────────

function PlayerPanel({
  player,
  allPlayers,
  isMe,
  isCurrent,
  avatarEmoji,
}: {
  player: Player;
  allPlayers: Player[];
  isMe: boolean;
  isCurrent: boolean;
  avatarEmoji: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const cards = safeCards(player.cards);
  const veggies = getVeggieCounts(cards);
  const score = calculateTotalScore(player, allPlayers);
  const veggieCards = cards.filter(c => !c.isFaceUp);
  const pointCards = cards.filter(c => c.isFaceUp);

  return (
    <div
      className={`
        rounded-2xl border transition-all duration-200 overflow-hidden
        ${isMe ? 'border-salad-lime/60 bg-salad-lime/10' : 'border-white/10 bg-black/20'}
        ${isCurrent ? 'ring-2 ring-salad-yellow shadow-lg' : ''}
      `}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-2.5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-2xl select-none">{avatarEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm truncate">{player.name}</span>
            {isMe && <span className="text-salad-lime text-[10px] font-bold bg-salad-lime/20 px-1.5 py-0.2 rounded">(You)</span>}
            {isCurrent && (
              <span className="text-salad-dark bg-salad-yellow text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                ▶ TURN
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            {(Object.entries(veggies) as [string, number][])
              .filter(([, v]) => v > 0)
              .map(([k, v]) => (
                <span key={k} className="text-[11px] text-white/80 bg-white/10 px-1.5 py-0.2 rounded-md font-mono">
                  {VEGGIE_EMOJI[k]} {v}
                </span>
              ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-salad-yellow font-display font-extrabold text-base">{score} pts</div>
          <div className="text-white/40 text-[10px]">{cards.length} cards</div>
        </div>
        <span className="text-white/40 text-xs ml-1 font-mono">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3 pt-1 border-t border-white/5 space-y-3"
          >
            {pointCards.length > 0 && (
              <div>
                <p className="text-salad-yellow text-[11px] font-bold uppercase tracking-wider mb-2">
                  Point Cards ({pointCards.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {pointCards.map(c => (
                    <VeggieCard
                      key={c.id}
                      card={c}
                      small
                      livePts={scorePointCard(c.id, veggies, allPlayers, player.sessionId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {veggieCards.length > 0 && (
              <div>
                <p className="text-salad-lime text-[11px] font-bold uppercase tracking-wider mb-2">
                  Veggies ({veggieCards.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    veggieCards.reduce<Record<string, number>>((acc, c) => {
                      acc[c.veggie] = (acc[c.veggie] ?? 0) + 1;
                      return acc;
                    }, {})
                  ).map(([veggie, count]) => (
                    <div
                      key={veggie}
                      className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10"
                    >
                      <span className="text-lg">{VEGGIE_EMOJI[veggie]}</span>
                      <span className="text-white text-xs font-bold capitalize">{veggie}</span>
                      <span className="text-salad-lime text-xs font-black font-mono ml-1">×{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cards.length === 0 && (
              <p className="text-white/40 text-xs py-1">No cards in hand yet.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main GamePage ────────────────────────────────────────────────────────────

export default function GamePage({ game }: Props) {
  const {
    room, sessionId, roomId,
    marketArray, pilesArray,
    draftPointCard,
    confirmMarketDraft,
    flipCardToVeggie,
  } = game;

  const [pendingPointPile, setPendingPointPile] = useState<number | null>(null);
  const [pendingMarket, setPendingMarket] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [mobileTab, setMobileTab] = useState<'table' | 'hand' | 'players'>('table');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!room) return null;

  const players = Object.values(room.players || {});
  const me = room.players?.[sessionId];
  const currentSid = room.playerOrder?.[room.currentTurnIndex];
  const isMyTurn = currentSid === sessionId;

  const myCards = safeCards(me?.cards);
  const myPointCards = myCards.filter(c => c.isFaceUp);
  const myVeggieCards = myCards.filter(c => !c.isFaceUp);
  const myVeggieCounts = getVeggieCounts(myCards);
  const myScore = me ? calculateTotalScore(me, players) : 0;

  const availableMarketCards = marketArray.flat().filter(c => c !== null).length;
  const allPilesEmpty = pilesArray.every(p => p.length === 0);
  const canConfirmSingleMarket = allPilesEmpty && availableMarketCards === 1;

  function handleSelectPile(i: number) {
    if (!isMyTurn || confirming) return;
    setPendingPointPile(prev => (prev === i ? null : i));
    setPendingMarket([]);
  }

  function handleSelectMarket(col: number, row: number) {
    if (!isMyTurn || confirming) return;
    const key = `${col}-${row}`;
    setPendingPointPile(null);
    setPendingMarket(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 2) return prev;
      return [...prev, key];
    });
  }

  async function handleConfirm() {
    if (confirming || !canConfirm) return;
    setConfirming(true);
    try {
      if (pendingPointPile !== null) {
        await draftPointCard(pendingPointPile);
      } else if (pendingMarket.length > 0) {
        await confirmMarketDraft(pendingMarket);
      }
    } finally {
      setPendingPointPile(null);
      setPendingMarket([]);
      setConfirming(false);
    }
  }

  function handleCancel() {
    if (confirming) return;
    setPendingPointPile(null);
    setPendingMarket([]);
  }

  const handleCopyCode = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const hasSelection = pendingPointPile !== null || pendingMarket.length > 0;
  const canConfirm =
    pendingPointPile !== null ||
    pendingMarket.length === 2 ||
    (pendingMarket.length === 1 && canConfirmSingleMarket);

  const confirmLabel = confirming
    ? '⏳ Confirming...'
    : pendingPointPile !== null
    ? `✅ Confirm Pile ${pendingPointPile + 1} Point Card`
    : pendingMarket.length === 2
    ? '✅ Confirm 2 Veggie Cards'
    : pendingMarket.length === 1 && canConfirmSingleMarket
    ? '✅ Take Last Veggie'
    : 'Select 1 more veggie…';

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Top App Bar ── */}
      <header className="sticky top-0 z-30 bg-salad-dark/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">🥗</span>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl text-salad-yellow tracking-wide font-extrabold hidden xs:inline-block">
                Point Salad
              </h1>
              {roomId && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-white/80 font-mono font-bold flex items-center gap-1 border border-white/10 transition-colors"
                  title="Click to copy Room Code"
                >
                  <span>{roomId}</span>
                  <span>{copiedCode ? '✓' : '📋'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Turn status banner */}
          <div className="flex items-center gap-2">
            <motion.div
              key={currentSid}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all shadow-md ${
                isMyTurn
                  ? 'bg-salad-lime text-salad-dark animate-pulse'
                  : 'bg-white/10 text-white/90 border border-white/10'
              }`}
            >
              <span className="inline-block">{isMyTurn ? '🎯' : '⏳'}</span>
              <span>
                {isMyTurn
                  ? 'Your Turn!'
                  : `${room.players?.[currentSid]?.name ?? 'Opponent'}'s turn`}
              </span>
            </motion.div>

            {/* Current player quick score indicator */}
            <div className="bg-salad-yellow/20 border border-salad-yellow/30 px-2.5 py-1 rounded-full text-xs font-extrabold text-salad-yellow hidden sm:flex items-center gap-1">
              <span>Score:</span>
              <span className="font-mono">{myScore} pts</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Tab Navigation (Hidden on lg+ screens) ── */}
      <div className="lg:hidden bg-black/30 border-b border-white/10 px-3 py-1.5 sticky top-[49px] z-20 backdrop-blur">
        <div className="flex rounded-xl bg-white/5 p-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobileTab('table')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              mobileTab === 'table'
                ? 'bg-salad-lime text-salad-dark shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>🛒 Table & Market</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('hand')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'hand'
                ? 'bg-salad-lime text-salad-dark shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>🃏 Hand</span>
            <span className="bg-salad-yellow/30 text-salad-yellow text-[10px] px-1 rounded-full font-mono">
              {myScore}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('players')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              mobileTab === 'players'
                ? 'bg-salad-lime text-salad-dark shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>👥 Players</span>
            <span className="text-[10px] opacity-70">({players.length})</span>
          </button>
        </div>
      </div>

      {/* ── Main Responsive Game Arena ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left / Main: The Table (Draw Piles + Market Columns) ── */}
        <section
          className={`lg:col-span-7 xl:col-span-7 space-y-4 ${
            mobileTab !== 'table' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Table Container Card */}
          <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl">
            {/* Guide header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="font-display text-lg sm:text-xl text-salad-lime font-bold">
                  Card Market & Piles
                </h2>
                <p className="text-white/60 text-xs">
                  {isMyTurn
                    ? 'Pick 1 Point Card from pile top OR pick 2 Veggie Cards from market.'
                    : 'Wait for your turn to draft cards.'}
                </p>
              </div>
              {isMyTurn && (
                <span className="text-[11px] font-extrabold bg-salad-lime/20 text-salad-lime border border-salad-lime/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Drafting
                </span>
              )}
            </div>

            {/* 3 Unified Columns: Pile on top, 2 Market cards directly underneath */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3.5 max-w-md sm:max-w-lg mx-auto justify-items-center">
              {[0, 1, 2].map(colIdx => {
                const pile = pilesArray[colIdx] ?? [];
                const topCard = pile[0] ?? null;
                const marketCol = marketArray[colIdx] ?? [null, null];

                return (
                  <div key={colIdx} className="flex flex-col items-center w-full max-w-[110px] space-y-2.5">
                    {/* Column Header */}
                    <div className="text-center">
                      <span className="text-[11px] font-extrabold text-salad-cream/70 uppercase tracking-wider">
                        Pile {colIdx + 1}
                      </span>
                    </div>

                    {/* Point Pile Card */}
                    <div
                      onClick={() => handleSelectPile(colIdx)}
                      className={`
                        relative w-[76px] h-[108px] sm:w-[84px] sm:h-[118px] md:w-[94px] md:h-[134px] rounded-xl shadow-md border-2
                        transition-all duration-200 select-none
                        ${isMyTurn && pile.length > 0 ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : 'border-white/15'}
                        ${pile.length === 0 ? 'opacity-30 cursor-not-allowed border-white/10' : ''}
                        ${pendingPointPile === colIdx ? 'border-salad-lime ring-4 ring-salad-lime ring-offset-2 ring-offset-salad-dark scale-105 shadow-xl' : ''}
                      `}
                    >
                      {topCard ? (
                        <PointCardInner card={topCard} small />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-white/5 flex flex-col items-center justify-center">
                          <span className="text-2xl opacity-20">📭</span>
                          <span className="text-[10px] text-white/30 font-bold mt-1">Empty</span>
                        </div>
                      )}

                      {/* Remaining pile count badge */}
                      {pile.length > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 bg-salad-dark text-salad-lime text-[10px] font-mono font-black rounded-full w-5 h-5 flex items-center justify-center border border-salad-lime shadow">
                          {pile.length}
                        </div>
                      )}
                    </div>

                    {/* Divider pointing to Market */}
                    <div className="w-8 h-px bg-white/15 my-0.5" />

                    {/* Market Rows (Row 0 and Row 1) */}
                    <div className="space-y-2 w-full flex flex-col items-center">
                      {[0, 1].map(rowIdx => {
                        const card = marketCol[rowIdx];
                        const key = `${colIdx}-${rowIdx}`;
                        const isSelected = pendingMarket.includes(key);

                        return card ? (
                          <VeggieCard
                            key={card.id}
                            card={card}
                            small
                            selectable={isMyTurn && pendingPointPile === null}
                            selected={isSelected}
                            onSelect={() => handleSelectMarket(colIdx, rowIdx)}
                          />
                        ) : (
                          <div
                            key={rowIdx}
                            className="w-[76px] h-[108px] sm:w-[84px] sm:h-[118px] md:w-[94px] md:h-[134px] rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-white/20"
                          >
                            <span className="text-lg opacity-40">🌿</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection Guidance Message */}
            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              {isMyTurn ? (
                <p className="text-xs text-salad-cream/80 font-semibold">
                  {pendingPointPile !== null
                    ? `Selected Pile ${pendingPointPile + 1} Point Card. Tap Confirm Draft to finish your turn.`
                    : pendingMarket.length === 1
                    ? '1 veggie selected. Select 1 more veggie card from the market.'
                    : pendingMarket.length === 2
                    ? '2 veggies selected. Tap Confirm Draft to collect them!'
                    : '👉 Tap a Point Pile (top card) OR tap 2 Veggies in the market.'}
                </p>
              ) : (
                <p className="text-xs text-white/40">
                  Waiting for {room.players?.[currentSid]?.name ?? 'current player'} to complete their draft...
                </p>
              )}
            </div>

            {/* Sticky/Floating Confirmation Bar */}
            <AnimatePresence>
              {isMyTurn && hasSelection && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="mt-4 flex items-center gap-2 p-2 bg-salad-green/30 border border-salad-lime/40 rounded-2xl shadow-lg"
                >
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={confirming}
                    className="px-4 py-3 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 font-bold text-xs sm:text-sm transition-colors active:scale-95 disabled:opacity-40"
                  >
                    ✕ Cancel
                  </button>
                  <motion.button
                    whileTap={canConfirm && !confirming ? { scale: 0.98 } : {}}
                    type="button"
                    onClick={handleConfirm}
                    disabled={!canConfirm || confirming}
                    className="flex-1 py-3 px-4 rounded-xl bg-salad-lime text-salad-dark font-display font-extrabold text-sm sm:text-base shadow-lg hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {confirmLabel}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── Right: Hand & Opponents ── */}
        <section
          className={`lg:col-span-5 xl:col-span-5 space-y-5 ${
            mobileTab === 'table' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* ── Player's Hand Panel ── */}
          {me && (
            <div
              className={`bg-salad-green/20 border border-salad-lime/40 rounded-3xl p-4 sm:p-5 shadow-xl ${
                mobileTab === 'players' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* Hand Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥗</span>
                  <div>
                    <h2 className="font-display text-lg text-salad-lime font-bold">Your Salad Hand</h2>
                    <p className="text-white/50 text-[11px]">{myCards.length} cards collected</p>
                  </div>
                </div>
                <div className="text-right bg-black/25 px-3 py-1.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-salad-cream/60 font-bold uppercase">Total Score</div>
                  <div className="font-display text-xl sm:text-2xl text-salad-yellow font-black">
                    {myScore} pts
                  </div>
                </div>
              </div>

              {/* Veggie Pantry / Shelf (Clean, Unclustered layout) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-salad-cream/80">
                    Veggie Ingredients
                  </span>
                  <span className="text-[11px] font-mono text-salad-lime font-bold">
                    {myVeggieCards.length} total
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['carrot', 'pepper', 'tomato', 'lettuce', 'onion', 'cabbage'] as VeggieType[]).map(veggie => {
                    const count = myVeggieCounts[veggie];
                    return (
                      <div
                        key={veggie}
                        className={`rounded-xl p-2 text-center transition-all border ${
                          count > 0
                            ? 'bg-white/10 border-white/20 shadow-sm'
                            : 'bg-white/5 border-white/5 opacity-40'
                        }`}
                      >
                        <span className="text-2xl block" role="img" aria-label={veggie}>
                          {VEGGIE_EMOJI[veggie]}
                        </span>
                        <div className="text-[10px] text-white/70 capitalize font-bold truncate">
                          {veggie}
                        </div>
                        <div className="text-xs sm:text-sm font-black font-mono text-salad-lime mt-0.5">
                          ×{count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Point Cards with Live Scores & Flip Actions */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-salad-yellow">
                    Point Scoring Cards ({myPointCards.length})
                  </span>
                  {isMyTurn && (
                    <span className="text-[10px] text-white/60 font-semibold">
                      {room.hasFlippedThisTurn ? '✓ Flip used this turn' : '⚡ 1 free flip per turn'}
                    </span>
                  )}
                </div>

                {myPointCards.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {myPointCards.map(c => {
                      const pts = scorePointCard(c.id, myVeggieCounts, players, sessionId);
                      return (
                        <div key={c.id} className="flex flex-col items-center gap-1.5 bg-black/20 p-1.5 rounded-2xl border border-white/10">
                          <VeggieCard card={c} small livePts={pts} />

                          {isMyTurn && (
                            <button
                              type="button"
                              onClick={() => flipCardToVeggie(c.id)}
                              disabled={room.hasFlippedThisTurn === true}
                              className="w-full py-1 px-1.5 rounded-lg bg-salad-green hover:bg-salad-dark text-white text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-salad-lime/30"
                              title={`Flip this point card into 1 ${c.veggie}`}
                            >
                              <span>🔄 Flip to</span>
                              <span>{VEGGIE_EMOJI[c.veggie]}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-black/10 rounded-2xl border border-dashed border-white/10">
                    <p className="text-white/40 text-xs">No point cards in hand.</p>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      Draft from the top of draw piles to earn scoring rules!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Other Players Leaderboard / Panels ── */}
          <div
            className={`space-y-2.5 ${
              mobileTab === 'hand' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">
                Other Players ({players.filter(p => p.sessionId !== sessionId).length})
              </h2>
              <span className="text-[10px] text-white/40">Tap player to view their cards</span>
            </div>

            {room.playerOrder
              .filter(sid => sid !== sessionId)
              .map(sid => {
                const p = room.players?.[sid];
                if (!p) return null;
                const aidx = room.playerOrder.indexOf(sid);
                return (
                  <PlayerPanel
                    key={sid}
                    player={p}
                    allPlayers={players}
                    isMe={false}
                    isCurrent={currentSid === sid}
                    avatarEmoji={AVATARS[aidx % 6]}
                  />
                );
              })}
          </div>
        </section>
      </main>
    </div>
  );
}
