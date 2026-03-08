import { motion } from 'framer-motion';
import type { useGameRoom } from '../hooks/useGameRoom';
import { calculateTotalScore, getVeggieCounts } from '../lib/scoring';
import type { VeggieType } from '../types/game';

type Props = { game: ReturnType<typeof useGameRoom> };

const VEGGIE_EMOJI: Record<string, string> = {
  carrot: '🥕', pepper: '🫑', tomato: '🍅', lettuce: '🥬', onion: '🧅', cabbage: '🥦',
};
const AVATARS = ['🥕', '🫑', '🍅', '🥬', '🧅', '🥦'];

export default function ResultsPage({ game }: Props) {
  const { room, sessionId, leaveRoom, resetToLobby } = game;
  if (!room) return null;

  const players = Object.values(room.players);
  const isHost = room.hostId === sessionId;

  const ranked = [...players]
    .map(p => ({ ...p, score: calculateTotalScore(p, players) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreak: later in turn order wins
      return room.playerOrder.indexOf(b.sessionId) - room.playerOrder.indexOf(a.sessionId);
    });

  const winner = ranked[0];
  const isWinner = winner.sessionId === sessionId;

  return (
    <div className="min-h-dvh bg-salad-dark flex flex-col items-center p-4 pb-8">
      {/* Header */}
      <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6 mt-4">
        <div className="text-5xl mb-2">{isWinner ? '🏆' : '🥗'}</div>
        <h1 className="font-display text-4xl text-salad-yellow">Game Over!</h1>
        <p className="text-salad-lime mt-1">
          {isWinner ? '🎉 You won!' : `🏆 ${winner.name} wins!`}
        </p>
      </motion.div>

      {/* Podium */}
      <div className="w-full max-w-md space-y-3 mb-8">
        {ranked.map((p, i) => {
          const aidx = room.playerOrder.indexOf(p.sessionId);
          const veggies = getVeggieCounts(p.cards);
          const isMe = p.sessionId === sessionId;
          const medals = ['🥇', '🥈', '🥉'];

          return (
            <motion.div key={p.sessionId}
              initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-4 border-2 transition-all
                ${isMe ? 'border-salad-lime bg-salad-lime/10' : 'border-white/10 bg-white/5'}
                ${i === 0 ? 'border-salad-yellow bg-salad-yellow/10' : ''}`}>

              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{medals[i] ?? `#${i + 1}`}</span>
                <span className="text-xl">{AVATARS[aidx % 6]}</span>
                <div className="flex-1">
                  <span className="text-white font-bold">{p.name}</span>
                  {isMe && <span className="text-salad-lime text-xs ml-2">(You)</span>}
                </div>
                <span className={`font-display text-2xl ${i === 0 ? 'text-salad-yellow' : 'text-white'}`}>
                  {p.score}pts
                </span>
              </div>

              {/* Veggie breakdown */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 pl-14">
                {(Object.entries(veggies) as [VeggieType, number][]).map(([v, count]) => (
                  <span key={v} className="text-xs text-white/60">
                    {VEGGIE_EMOJI[v]}×{count}
                  </span>
                ))}
              </div>

              {/* Point card breakdown */}
              <div className="mt-2 pl-14">
                <div className="flex flex-wrap gap-1">
                  {p.cards.filter(c => c.isFaceUp).map(c => (
                    <span key={c.id} className="bg-salad-yellow/20 text-salad-yellow text-[9px] rounded px-1.5 py-0.5 font-bold">
                      {c.pointText}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-3">
        {isHost ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetToLobby}
            className="w-full px-8 py-4 bg-salad-lime text-salad-dark font-display text-xl rounded-2xl shadow-lg"
          >
            🌱 Play Again
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full px-8 py-4 bg-white/5 border border-white/10 text-white/40 font-bold text-sm text-center rounded-2xl"
          >
            ⏳ Waiting for host to start a new game…
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={leaveRoom}
          className="w-full px-8 py-3 border border-white/20 text-white/50 font-bold text-sm rounded-2xl hover:bg-white/5 transition-colors"
        >
          🚪 Leave Room
        </motion.button>
      </div>
    </div>
  );
}
