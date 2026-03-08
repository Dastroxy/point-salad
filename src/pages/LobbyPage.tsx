import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { useGameRoom } from '../hooks/useGameRoom';

type Props = { game: ReturnType<typeof useGameRoom> };

const VEGGIE_EMOJIS = ['🥕', '🫑', '🍅', '🥬', '🧅', '🥦'];

export default function LobbyPage({ game }: Props) {
  const { room, roomId, sessionId, error, loading, createRoom, joinRoom, startGame, leaveRoom } = game;
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const isHost = room?.hostId === sessionId;
  const players = room ? Object.values(room.players) : [];

  // Pre-game lobby view
  if (room && room.phase === 'lobby') {
    return (
      <div className="min-h-dvh bg-salad-dark flex flex-col items-center justify-between p-4 safe-bottom">
        {/* Header */}
        <div className="w-full max-w-md">
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6">
            <h1 className="font-display text-5xl text-salad-yellow drop-shadow-lg">🥗 Point Salad</h1>
            <p className="text-salad-lime font-body text-lg">Card Drafting Game</p>
          </motion.div>

          {/* Room code */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-salad-green/30 border-2 border-salad-lime rounded-2xl p-4 mb-4 text-center">
            <p className="text-salad-cream/70 text-sm font-body mb-1">Room Code</p>
            <p className="font-display text-4xl text-white tracking-widest">{roomId}</p>
            <p className="text-salad-cream/60 text-xs mt-1">Share this code with friends</p>
          </motion.div>

          {/* Players */}
          <div className="space-y-2 mb-4">
            <p className="text-salad-lime text-sm font-bold px-1">{players.length}/6 Players</p>
            <AnimatePresence>
              {players.map((p, i) => (
                <motion.div key={p.sessionId}
                  initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <span className="text-2xl">{VEGGIE_EMOJIS[i % 6]}</span>
                  <span className="text-white font-bold flex-1">{p.name}</span>
                  {p.isHost && <span className="text-salad-yellow text-xs font-bold bg-salad-yellow/20 px-2 py-0.5 rounded-full">HOST</span>}
                  {p.sessionId === sessionId && <span className="text-salad-lime text-xs">You</span>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
        </div>

        {/* Actions */}
        <div className="w-full max-w-md space-y-3">
          {isHost && (
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={startGame}
              disabled={players.length < 2 || loading}
              className="w-full py-4 rounded-2xl font-display text-xl bg-salad-lime text-salad-dark shadow-lg disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow">
              {players.length < 2 ? 'Waiting for players...' : '🚀 Start Game!'}
            </motion.button>
          )}
          {!isHost && (
            <div className="text-center text-salad-cream/70 font-body">Waiting for host to start...</div>
          )}
          <button onClick={leaveRoom} className="w-full py-3 rounded-xl text-salad-cream/60 text-sm hover:text-red-400 transition-colors">
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  // Landing / join/create view
  return (
    <div className="min-h-dvh bg-salad-dark flex flex-col items-center justify-center p-4">
      <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <div className="text-6xl mb-2">🥗</div>
        <h1 className="font-display text-5xl sm:text-6xl text-salad-yellow drop-shadow-xl mb-1">Point Salad</h1>
        <p className="text-salad-lime font-body text-base">A card-drafting game for 2–6 players</p>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
        className="w-full max-w-sm bg-white/10 backdrop-blur rounded-3xl p-6 shadow-2xl border border-white/10">

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden mb-5 bg-black/20">
          {(['create', 'join'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-bold transition-all ${tab === t ? 'bg-salad-lime text-salad-dark' : 'text-white/60'}`}>
              {t === 'create' ? '✨ Create' : '🔗 Join'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-salad-lime transition-colors"
          />

          <AnimatePresence mode="wait">
            {tab === 'join' && (
              <motion.input key="join" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Room code" maxLength={6}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-base uppercase tracking-widest focus:outline-none focus:border-salad-lime transition-colors"
              />
            )}
          </AnimatePresence>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
            disabled={loading || !name.trim()}
            onClick={() => tab === 'create' ? createRoom(name) : joinRoom(joinCode, name)}
            className="w-full py-4 rounded-xl font-display text-xl bg-salad-lime text-salad-dark shadow-lg disabled:opacity-50 mt-2">
            {loading ? '...' : tab === 'create' ? '🌱 Create Room' : '🚪 Join Room'}
          </motion.button>
        </div>
      </motion.div>

    </div>
  );
}
