import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { useGameRoom } from '../hooks/useGameRoom';

type Props = { game: ReturnType<typeof useGameRoom> };

const VEGGIE_EMOJIS = ['🥕', '🫑', '🍅', '🥬', '🧅', '🥦'];

export default function LobbyPage({ game }: Props) {
  const { room, roomId, sessionId, playerName, error, loading, createRoom, joinRoom, startGame, leaveRoom } = game;
  const [name, setName] = useState(playerName || '');
  const [joinCode, setJoinCode] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('room');
      return p ? p.toUpperCase() : '';
    } catch {
      return '';
    }
  });
  const [tab, setTab] = useState<'create' | 'join'>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('room');
      return p ? 'join' : 'create';
    } catch {
      return 'create';
    }
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (playerName && !name) {
      setName(playerName);
    }
  }, [playerName, name]);

  const isHost = room?.hostId === sessionId;
  const players = room ? Object.values(room.players || {}) : [];

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

  const handleCopyLink = async () => {
    if (!roomId) return;
    try {
      const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  // Pre-game lobby view
  if (room && room.phase === 'lobby') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-between p-4 sm:p-6 safe-bottom">
        {/* Header */}
        <div className="w-full max-w-lg mx-auto">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6">
            <span className="text-4xl sm:text-5xl inline-block mb-1">🥗</span>
            <h1 className="font-display text-4xl sm:text-5xl text-salad-yellow drop-shadow-md tracking-wide">
              Point Salad
            </h1>
            <p className="text-salad-lime font-body text-sm sm:text-base font-semibold">
              Game Lobby • 2 to 6 Players
            </p>
          </motion.div>

          {/* Room code card with copy actions */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="bg-salad-dark/80 backdrop-blur border border-salad-lime/30 shadow-xl rounded-2xl p-5 mb-5 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-salad-yellow via-salad-lime to-salad-green opacity-70" />
            <p className="text-salad-cream/70 text-xs font-bold uppercase tracking-wider mb-1">Room Code</p>
            <div className="font-display text-4xl sm:text-5xl text-white tracking-widest my-1 font-extrabold select-all">
              {roomId}
            </div>
            <p className="text-salad-cream/60 text-xs mb-3">Share this code or link with your friends</p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
              >
                {copiedCode ? '✓ Copied Code!' : '📋 Copy Code'}
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-xl bg-salad-lime/20 hover:bg-salad-lime/30 active:scale-95 text-salad-lime text-xs font-bold transition-all flex items-center gap-1.5 border border-salad-lime/30"
              >
                {copiedLink ? '✓ Copied Link!' : '🔗 Copy Invite Link'}
              </button>
            </div>
          </motion.div>

          {/* Players List */}
          <div className="bg-black/25 backdrop-blur border border-white/10 rounded-2xl p-4 mb-5 shadow-lg">
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-salad-lime font-bold text-sm">Players</span>
                <span className="text-xs bg-white/10 text-white/80 px-2 py-0.5 rounded-full font-mono font-bold">
                  {players.length} / 6
                </span>
              </div>
              <span className="text-xs text-salad-cream/60">
                {players.length < 2 ? 'Need 1+ more' : 'Ready to start'}
              </span>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {players.map((p, i) => (
                  <motion.div
                    key={p.sessionId}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 16, opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all border ${
                      p.sessionId === sessionId
                        ? 'bg-salad-lime/15 border-salad-lime/40'
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <span className="text-2xl select-none" role="img" aria-label="avatar">
                      {VEGGIE_EMOJIS[i % 6]}
                    </span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-white font-bold text-sm sm:text-base truncate">{p.name}</span>
                      {p.sessionId === sessionId && (
                        <span className="text-salad-lime text-[11px] font-bold bg-salad-lime/20 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    {p.isHost && (
                      <span className="text-salad-yellow text-[11px] font-extrabold bg-salad-yellow/20 px-2 py-0.5 rounded-md tracking-wider">
                        HOST
                      </span>
                    )}
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${p.isConnected ? 'bg-emerald-400' : 'bg-white/30'}`}
                      title={p.isConnected ? 'Connected' : 'Reconnecting'}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-400/40 text-red-200 text-xs sm:text-sm rounded-xl p-3 text-center mb-4"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="w-full max-w-lg mx-auto space-y-3 pt-2">
          {isHost ? (
            <div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={startGame}
                disabled={players.length < 2 || loading}
                className="w-full py-3.5 sm:py-4 rounded-2xl font-display text-lg sm:text-xl bg-salad-lime text-salad-dark font-extrabold shadow-lg hover:brightness-105 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading
                  ? 'Starting game...'
                  : players.length < 2
                  ? '⏳ Waiting for 1 more player...'
                  : '🚀 Start Game!'}
              </motion.button>
              {players.length < 2 && (
                <p className="text-center text-salad-cream/50 text-xs mt-2">
                  At least 2 players are required to deal cards and start.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-center text-salad-cream/80 text-sm font-semibold flex items-center justify-center gap-2">
              <span className="inline-block animate-spin text-base">⏳</span>
              Waiting for host to launch the game...
            </div>
          )}

          <button
            type="button"
            onClick={leaveRoom}
            className="w-full py-2.5 rounded-xl text-salad-cream/60 hover:text-red-300 text-xs font-semibold hover:bg-white/5 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  // Landing / join / create view
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Brand Header */}
      <motion.div
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6 sm:mb-8"
      >
        <div className="text-5xl sm:text-6xl mb-2 select-none filter drop-shadow">🥗</div>
        <h1 className="font-display text-4xl sm:text-6xl text-salad-yellow drop-shadow-md font-extrabold tracking-tight">
          Point Salad
        </h1>
        <p className="text-salad-lime font-body text-sm sm:text-base font-semibold mt-1">
          The fast & fun card-drafting game
        </p>
      </motion.div>

      {/* Main Join/Create Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-full max-w-sm sm:max-w-md bg-salad-dark/85 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/15"
      >
        {/* Mode Switcher Tabs */}
        <div className="flex rounded-xl overflow-hidden p-1 mb-5 bg-black/30 border border-white/10">
          {(['create', 'join'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                tab === t
                  ? 'bg-salad-lime text-salad-dark shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t === 'create' ? '✨ Create Room' : '🔗 Join Room'}
            </button>
          ))}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            if (!loading && name.trim()) {
              if (tab === 'create') createRoom(name);
              else if (joinCode.trim()) joinRoom(joinCode, name);
            }
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-[11px] font-bold text-salad-cream/70 uppercase tracking-wider mb-1.5 pl-1">
              Your Player Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Chef Oliver"
              maxLength={20}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/35 rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:border-salad-lime focus:ring-2 focus:ring-salad-lime/30 transition-all font-semibold"
            />
          </div>

          <AnimatePresence mode="wait">
            {tab === 'join' && (
              <motion.div
                key="join-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-[11px] font-bold text-salad-cream/70 uppercase tracking-wider mb-1.5 pl-1">
                  Room Code (4 Letters)
                </label>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WXYZ"
                  maxLength={6}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/35 rounded-xl px-4 py-3 text-sm sm:text-base uppercase tracking-widest font-mono font-bold focus:outline-none focus:border-salad-lime focus:ring-2 focus:ring-salad-lime/30 transition-all text-center"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-2.5 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-xs text-center font-semibold"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !name.trim() || (tab === 'join' && !joinCode.trim())}
            className="w-full py-3.5 sm:py-4 rounded-xl font-display text-lg sm:text-xl bg-salad-lime text-salad-dark font-extrabold shadow-lg hover:brightness-105 active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2"
          >
            {loading ? 'Connecting...' : tab === 'create' ? '🌱 Create Room' : '🚪 Join Room'}
          </motion.button>
        </form>

        {/* Quick Rules Collapsible */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setShowRules(prev => !prev)}
            className="w-full flex items-center justify-between text-xs text-salad-cream/70 hover:text-salad-lime transition-colors font-bold px-1"
          >
            <span>📖 How to Play</span>
            <span>{showRules ? '▲' : '▼'}</span>
          </button>

          <AnimatePresence>
            {showRules && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 text-xs text-salad-cream/80 space-y-1.5 bg-black/20 p-3 rounded-xl border border-white/5 font-body leading-relaxed"
              >
                <p>• <strong>Turn Options:</strong> Take <strong>1 Point Card</strong> from the top of any pile, OR take <strong>2 Veggie Cards</strong> from the market.</p>
                <p>• <strong>Free Flip Action:</strong> Once per turn, you can flip 1 of your Point Cards to its veggie side.</p>
                <p>• <strong>Goal:</strong> Craft the highest-scoring salad combo by balancing Point scoring rules with fresh veggies!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
