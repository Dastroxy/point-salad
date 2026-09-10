import { motion } from 'framer-motion';
import type { useGameRoom } from '../hooks/useGameRoom';
import { calculateTotalScore, getVeggieCounts, scorePointCard } from '../lib/scoring';
import type { Card, VeggieType } from '../types/game';

type Props = { game: ReturnType<typeof useGameRoom> };

const VEGGIE_EMOJI: Record<string, string> = {
  carrot: '🥕', pepper: '🫑', tomato: '🍅', lettuce: '🥬', onion: '🧅', cabbage: '🥦',
};
const AVATARS = ['🥕', '🫑', '🍅', '🥬', '🧅', '🥦'];

function safeCards(cards: Card[] | Record<string, Card> | null | undefined): Card[] {
  if (!cards) return [];
  if (Array.isArray(cards)) return cards;
  return Object.values(cards);
}

export default function ResultsPage({ game }: Props) {
  const { room, sessionId, leaveRoom, resetToLobby } = game;
  if (!room) return null;

  const players = Object.values(room.players || {});
  const isHost = room.hostId === sessionId;

  const ranked = [...players]
    .map(p => ({
      ...p,
      cards: safeCards(p.cards),
      score: calculateTotalScore(p, players),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreak: later in turn order wins
      return (room.playerOrder || []).indexOf(b.sessionId) - (room.playerOrder || []).indexOf(a.sessionId);
    });

  const winner = ranked[0];
  const isWinner = winner?.sessionId === sessionId;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between p-4 sm:p-6 pb-8">
      {/* Header */}
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ y: -25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6 mt-2"
        >
          <div className="text-5xl sm:text-6xl mb-2 select-none animate-bounce">
            {isWinner ? '🏆' : '🥗'}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-salad-yellow font-extrabold tracking-tight">
            Final Scores
          </h1>
          <p className="text-salad-lime font-body text-base sm:text-lg font-bold mt-1">
            {isWinner
              ? '🎉 Victory! You crafted the finest Point Salad!'
              : `👑 ${winner?.name ?? 'Player'} wins with ${winner?.score ?? 0} points!`}
          </p>
        </motion.div>

        {/* Podium Leaderboard */}
        <div className="space-y-3.5 mb-6">
          {ranked.map((p, i) => {
            const aidx = (room.playerOrder || []).indexOf(p.sessionId);
            const pCards = safeCards(p.cards);
            const veggies = getVeggieCounts(pCards);
            const isMe = p.sessionId === sessionId;
            const medals = ['🥇', '🥈', '🥉'];
            const pointCards = pCards.filter(c => c.isFaceUp);

            return (
              <motion.div
                key={p.sessionId}
                initial={{ x: -25, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-lg relative overflow-hidden ${
                  i === 0
                    ? 'border-salad-yellow bg-salad-yellow/15 ring-2 ring-salad-yellow/30'
                    : isMe
                    ? 'border-salad-lime/60 bg-salad-lime/10'
                    : 'border-white/10 bg-black/25'
                }`}
              >
                {i === 0 && (
                  <div className="absolute top-0 right-0 bg-salad-yellow text-salad-dark text-[10px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
                    Champion
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-2xl select-none" role="img" aria-label={`Rank ${i + 1}`}>
                    {medals[i] ?? `#${i + 1}`}
                  </span>
                  <span className="text-2xl select-none">{AVATARS[aidx % 6]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-base sm:text-lg truncate">{p.name}</span>
                      {isMe && (
                        <span className="text-salad-lime text-[11px] font-bold bg-salad-lime/20 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-white/50 text-xs">{pCards.length} cards total</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-display text-2xl sm:text-3xl font-extrabold ${
                        i === 0 ? 'text-salad-yellow' : 'text-white'
                      }`}
                    >
                      {p.score}
                    </span>
                    <span className="text-xs text-white/50 font-bold ml-1">pts</span>
                  </div>
                </div>

                {/* Veggie breakdown shelf */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                  {(Object.entries(veggies) as [VeggieType, number][])
                    .filter(([, count]) => count > 0)
                    .map(([v, count]) => (
                      <span
                        key={v}
                        className="bg-white/10 border border-white/10 text-white/90 text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono font-bold"
                      >
                        <span>{VEGGIE_EMOJI[v]}</span>
                        <span>{count}</span>
                      </span>
                    ))}
                </div>

                {/* Point cards scored breakdown */}
                {pointCards.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-salad-cream/60 mb-1.5">
                      Point Cards ({pointCards.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pointCards.map(c => {
                        const ptsEarned = scorePointCard(c.id, veggies, players, p.sessionId);
                        return (
                          <span
                            key={c.id}
                            className="bg-amber-500/20 border border-amber-500/30 text-amber-200 text-[10px] rounded-lg px-2 py-1 font-semibold flex items-center gap-1"
                          >
                            <span>{c.pointText}</span>
                            <strong className="text-salad-yellow font-mono">
                              ({ptsEarned > 0 ? `+${ptsEarned}` : ptsEarned})
                            </strong>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xl mx-auto space-y-3">
        {isHost ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetToLobby}
            className="w-full py-4 bg-salad-lime text-salad-dark font-display text-xl font-extrabold rounded-2xl shadow-xl hover:brightness-105 transition-all"
          >
            🌱 Play Another Round
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full py-3.5 px-4 bg-white/5 border border-white/10 text-white/60 font-bold text-sm text-center rounded-2xl flex items-center justify-center gap-2"
          >
            <span className="animate-spin text-base">⏳</span>
            Waiting for host to restart game...
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={leaveRoom}
          className="w-full py-3 border border-white/20 text-white/70 hover:text-white font-bold text-sm rounded-2xl hover:bg-white/10 transition-colors"
        >
          🚪 Return to Home
        </motion.button>
      </div>
    </div>
  );
}
