import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { useGameRoom } from '../hooks/useGameRoom';
import type { Card, Player, VeggieType } from '../types/game';
import { calculateTotalScore, getVeggieCounts } from '../lib/scoring';

type Props = { game: ReturnType<typeof useGameRoom> };

const VEGGIE_EMOJI: Record<string, string> = {
  carrot: '🥕', pepper: '🫑', tomato: '🍅',
  lettuce: '🥬', onion: '🧅', cabbage: '🥦',
};

const VEGGIE_COLOR: Record<string, string> = {
  carrot: 'bg-orange-400',
  pepper: 'bg-red-500',
  tomato: 'bg-red-700',
  lettuce: 'bg-green-500',
  onion: 'bg-purple-500',
  cabbage: 'bg-blue-400',
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

function PointCardInner({ card, small }: { card: Card; small?: boolean }) {
  const { veggies, negative } = parsePointCard(card.pointText, card.veggie);
  const lines = wrapText(card.pointText, small ? 12 : 15);
  const veggieBgColor = VEGGIE_BG[card.veggie] ?? '#8bc34a';

  return (
    <div className="bg-salad-yellow w-full h-full rounded-xl flex flex-col overflow-hidden">
      <div
        className="flex items-center justify-center pt-1.5 pb-1 flex-shrink-0"
        style={{ background: `${veggieBgColor}22` }}
      >
        <div
          className="rounded-full flex items-center justify-center shadow-sm"
          style={{
            background: veggieBgColor,
            width: small ? 22 : 28,
            height: small ? 22 : 28,
          }}
        >
          <span style={{ fontSize: small ? 11 : 14 }}>{VEGGIE_EMOJI[card.veggie]}</span>
        </div>
      </div>

      <div className="h-px mx-2" style={{ background: `${veggieBgColor}55` }} />

      <div className="flex-1 flex flex-col items-center justify-center px-1 py-0.5">
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-salad-dark font-bold text-center leading-tight w-full"
            style={{
              fontFamily: '"Baloo 2", cursive',
              fontSize: small ? 8.5 : 10,
              lineHeight: 1.3,
            }}
          >
            {line}
          </p>
        ))}
      </div>

      <div className="h-px mx-2" style={{ background: `${veggieBgColor}55` }} />

      <div className="flex items-center justify-center gap-1 py-1 px-1 flex-shrink-0 flex-wrap">
        {veggies.map((v, i) => (
          <span key={i} style={{ fontSize: small ? 10 : 13 }}>{VEGGIE_EMOJI[v]}</span>
        ))}
        {negative.map((v, i) => (
          <span key={`neg-${i}`} style={{ fontSize: small ? 10 : 13, opacity: 0.5 }}>
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
}

function VeggieCard({ card, selectable, selected, onSelect, small }: VeggieCardProps) {
  const sizeClass = small
    ? 'w-[72px] h-[104px]'
    : 'w-[90px] h-[130px] sm:w-[110px] sm:h-[155px]';

  if (!card.isFaceUp) {
    return (
      <motion.div
        layout
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={selectable ? { scale: 0.93 } : {}}
        onClick={onSelect}
        className={`
          relative rounded-xl select-none overflow-hidden shadow-md flex-shrink-0
          transition-all duration-200 ${sizeClass}
          ${selectable ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
          ${selected ? 'ring-4 ring-salad-lime ring-offset-2 scale-105' : ''}
        `}
      >
        <div className={`${VEGGIE_COLOR[card.veggie]} w-full h-full flex flex-col items-center justify-center gap-1`}>
          <span className={small ? 'text-2xl' : 'text-3xl sm:text-4xl'}>{VEGGIE_EMOJI[card.veggie]}</span>
          <p className="text-white text-[10px] sm:text-xs font-bold capitalize">{card.veggie}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={selectable ? { scale: 0.93 } : {}}
      onClick={onSelect}
      className={`
        relative rounded-xl select-none overflow-hidden shadow-md flex-shrink-0
        transition-all duration-200 ${sizeClass}
        ${selectable ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
        ${selected ? 'ring-4 ring-salad-lime ring-offset-2 scale-105' : ''}
      `}
    >
      <PointCardInner card={card} small={small} />
    </motion.div>
  );
}

// ─── Player Panel ─────────────────────────────────────────────────────────────

function PlayerPanel({ player, allPlayers, isMe, isCurrent, avatarEmoji }: {
  player: Player;
  allPlayers: Player[];
  isMe: boolean;
  isCurrent: boolean;
  avatarEmoji: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const veggies = getVeggieCounts(player.cards || []);
  const score = calculateTotalScore(player, allPlayers);
  const veggieCards = (player.cards || []).filter(c => !c.isFaceUp);
  const pointCards = (player.cards || []).filter(c => c.isFaceUp);

  return (
    <div className={`
      rounded-2xl border transition-all duration-200
      ${isMe ? 'border-salad-lime bg-white/10' : 'border-white/20 bg-white/5'}
      ${isCurrent ? 'ring-2 ring-salad-yellow' : ''}
    `}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-2 text-left"
      >
        <span className="text-xl">{avatarEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white font-bold text-sm truncate">{player.name}</span>
            {isMe && <span className="text-salad-lime text-[10px] font-bold">(You)</span>}
            {isCurrent && (
              <span className="text-salad-yellow text-[10px] font-bold animate-pulse">▶ Turn</span>
            )}
          </div>
          <div className="flex gap-1.5 mt-0.5 flex-wrap">
            {(Object.entries(veggies) as [string, number][])
              .filter(([, v]) => v > 0)
              .map(([k, v]) => (
                <span key={k} className="text-[10px] text-white/60">
                  {VEGGIE_EMOJI[k]}×{v}
                </span>
              ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-salad-yellow font-bold text-sm">{score}pts</div>
          <div className="text-white/40 text-[10px]">{(player.cards || []).length} cards</div>
        </div>
        <span className="text-white/40 text-sm ml-1">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-3 pb-3"
          >
            {pointCards.length > 0 && (
              <div className="mb-3">
                <p className="text-salad-yellow text-[10px] font-bold mb-1.5 uppercase tracking-wide">
                  📋 Point Cards ({pointCards.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pointCards.map(c => <VeggieCard key={c.id} card={c} small />)}
                </div>
              </div>
            )}

            {veggieCards.length > 0 && (
              <div>
                <p className="text-salad-lime text-[10px] font-bold mb-1.5 uppercase tracking-wide">
                  🥗 Veggie Cards ({veggieCards.length})
                </p>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(
                    veggieCards.reduce<Record<string, Card[]>>((acc, c) => {
                      acc[c.veggie] = [...(acc[c.veggie] ?? []), c];
                      return acc;
                    }, {})
                  ).map(([veggie, stack]) => (
                    <div
                      key={veggie}
                      className="relative flex-shrink-0"
                      style={{ width: 72, height: 104 + (stack.length - 1) * 20 }}
                    >
                      {stack.map((c, i) => (
                        <div
                          key={c.id}
                          className="absolute rounded-xl ring-2 ring-white/30"
                          style={{ top: i * 20, left: 0, zIndex: i }}
                        >
                          <VeggieCard card={c} small />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(player.cards || []).length === 0 && (
              <p className="text-white/30 text-xs">No cards yet</p>
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
    room, sessionId,
    marketArray, pilesArray,
    draftPointCard,
    confirmMarketDraft,
    flipCardToVeggie,
  } = game;

  const [pendingPointPile, setPendingPointPile] = useState<number | null>(null);
  const [pendingMarket, setPendingMarket] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  if (!room) return null;

  const players = Object.values(room.players || {});
  const me = room.players?.[sessionId];
  const currentSid = room.playerOrder?.[room.currentTurnIndex];
  const isMyTurn = currentSid === sessionId;

  const myPointCards = (me?.cards || []).filter(c => c.isFaceUp);
  const myVeggieCards = (me?.cards || []).filter(c => !c.isFaceUp);
  const myScore = me ? calculateTotalScore(me, players) : 0;

  const availableMarketCards = marketArray.flat().filter(c => c !== null).length;
  const allPilesEmpty = pilesArray.every(p => p.length === 0);
  const canConfirmSingleMarket = allPilesEmpty && availableMarketCards === 1;

  function handleSelectPile(i: number) {
    if (!isMyTurn || confirming) return;
    setPendingPointPile(prev => prev === i ? null : i);
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

  const hasSelection = pendingPointPile !== null || pendingMarket.length > 0;
  const canConfirm =
    pendingPointPile !== null ||
    pendingMarket.length === 2 ||
    (pendingMarket.length === 1 && canConfirmSingleMarket);

  const confirmLabel = confirming
    ? '⏳ Confirming...'
    : pendingPointPile !== null
      ? '✅ Confirm Point Card'
      : pendingMarket.length === 2
        ? '✅ Confirm 2 Veggies'
        : pendingMarket.length === 1 && canConfirmSingleMarket
          ? '✅ Take Last Veggie'
          : 'Select 1 more veggie…';

  return (
    <div className="min-h-dvh bg-salad-dark flex flex-col max-w-2xl mx-auto">

      {/* ── Sticky Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur sticky top-0 z-20">
        <h1 className="font-display text-2xl text-salad-yellow">🥗 Point Salad</h1>
        <motion.div
          key={currentSid}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            isMyTurn
              ? 'bg-salad-lime text-salad-dark animate-pulse-glow'
              : 'bg-white/10 text-white/60'
          }`}
        >
          {isMyTurn
            ? '🎯 Your Turn!'
            : `${room.players?.[currentSid]?.name ?? '...'}'s turn`}
        </motion.div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 pb-6">

        {/* ── Draft Area ── */}
        <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
          <p className="text-salad-cream/60 text-[11px] font-bold mb-3 uppercase tracking-wide">
            {isMyTurn
              ? '👆 Draft 1 Point Card (pile) OR 2 Veggie Cards (market)'
              : '📦 Card Market'}
          </p>

          {/* Point Piles */}
          <div className="flex gap-2 sm:gap-3 justify-center mb-4">
            {pilesArray.map((pile, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  onClick={() => handleSelectPile(i)}
                  className={`
                    relative w-[90px] h-[130px] sm:w-[110px] sm:h-[155px] rounded-xl shadow-lg border-2
                    transition-all duration-200
                    ${isMyTurn && pile.length > 0
                      ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
                      : 'border-white/20'}
                    ${pile.length === 0
                      ? 'opacity-30 cursor-not-allowed border-white/10'
                      : ''}
                    ${pendingPointPile === i
                      ? 'border-salad-lime ring-4 ring-salad-lime ring-offset-2 scale-105'
                      : isMyTurn && pile.length > 0
                        ? 'border-salad-lime/40'
                        : ''}
                  `}
                >
                  {pile[0] ? (
                    <PointCardInner card={pile[0]} small={false} />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-white/5 flex items-center justify-center">
                      <span className="text-3xl opacity-30">📭</span>
                    </div>
                  )}
                  {pile.length > 0 && (
                    <div className="absolute -bottom-1.5 -right-1.5 bg-salad-dark text-salad-lime text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-salad-lime">
                      {pile.length}
                    </div>
                  )}
                </div>
                <p className="text-white/50 text-[10px]">Pile {i + 1}</p>
              </div>
            ))}
          </div>

          {/* Veggie Market */}
          <div>
            <p className="text-salad-lime/70 text-[10px] font-bold uppercase mb-2">
              Veggie Market
              {pendingMarket.length > 0 && (
                <span className="text-salad-lime ml-1 normal-case font-normal">
                  — {pendingMarket.length}/2 selected
                </span>
              )}
              {canConfirmSingleMarket && (
                <span className="text-salad-yellow ml-1 normal-case font-normal">
                  — last card!
                </span>
              )}
            </p>
            <div className="flex gap-2 sm:gap-3 justify-center">
              {marketArray.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-2">
                  {col.map((card, ri) =>
                    card ? (
                      <VeggieCard
                        key={card.id}
                        card={card}
                        small
                        selectable={isMyTurn && pendingPointPile === null}
                        selected={pendingMarket.includes(`${ci}-${ri}`)}
                        onSelect={() => handleSelectMarket(ci, ri)}
                      />
                    ) : (
                      <div
                        key={ri}
                        className="w-[72px] h-[104px] rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center"
                      >
                        <span className="text-xl opacity-20">🌿</span>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Confirm / Cancel Bar ── */}
          <AnimatePresence>
            {isMyTurn && hasSelection && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 flex gap-2"
              >
                <button
                  onClick={handleCancel}
                  disabled={confirming}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                  ✕ Cancel
                </button>
                <motion.button
                  whileTap={canConfirm && !confirming ? { scale: 0.97 } : {}}
                  onClick={handleConfirm}
                  disabled={!canConfirm || confirming}
                  className="flex-[2] py-3 rounded-xl bg-salad-lime text-salad-dark font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {confirmLabel}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── My Hand ── */}
        {me && (
          <div className="bg-salad-green/20 border border-salad-lime/40 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-salad-lime font-bold text-sm">🃏 Your Hand</p>
              <p className="text-salad-yellow font-bold text-sm">{myScore} pts</p>
            </div>

            {/* Point cards with Flip button */}
            {myPointCards.length > 0 && (
              <div className="mb-3">
                <p className="text-salad-yellow text-[10px] font-bold uppercase tracking-wide mb-2">
                  📋 Point Cards
                  {isMyTurn && (
                    <span className="text-white/40 normal-case font-normal ml-1">
                      {room.hasFlippedThisTurn
                        ? '— flip used this turn'
                        : '— tap FLIP to convert to veggie (free, once per turn)'}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-3">
                  {myPointCards.map(c => (
                    <div key={c.id} className="flex flex-col items-center gap-1.5">
                      {isMyTurn && (
                        <button
                          onClick={() => flipCardToVeggie(c.id)}
                          disabled={room.hasFlippedThisTurn === true}
                          className="px-3 py-1.5 bg-salad-green text-white text-xs font-bold rounded-lg shadow-md hover:bg-salad-dark active:scale-95 transition-all min-w-[72px] min-h-[32px] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          🔄 Flip
                        </button>
                      )}
                      <VeggieCard card={c} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Veggie cards — stacked by type */}
            {myVeggieCards.length > 0 && (
              <div>
                <p className="text-salad-lime text-[10px] font-bold uppercase tracking-wide mb-2">
                  🥗 Veggies
                </p>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(
                    myVeggieCards.reduce<Record<string, Card[]>>((acc, c) => {
                      acc[c.veggie] = [...(acc[c.veggie] ?? []), c];
                      return acc;
                    }, {})
                  ).map(([veggie, stack]) => (
                    <div
                      key={veggie}
                      className="relative flex-shrink-0"
                      style={{ width: 90, height: 130 + (stack.length - 1) * 20 }}
                    >
                      {stack.map((c, i) => (
                        <div
                          key={c.id}
                          className="absolute rounded-xl ring-2 ring-white/30"
                          style={{ top: i * 20, left: 0, zIndex: i }}
                        >
                          <VeggieCard card={c} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(me.cards || []).length === 0 && (
              <p className="text-white/30 text-sm text-center py-4">
                Draft cards above to build your salad! 🥗
              </p>
            )}
          </div>
        )}

        {/* ── Other Players ── */}
        {players.filter(p => p.sessionId !== sessionId).length > 0 && (
          <div className="space-y-2">
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-wide px-1">
              Other Players
            </p>
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
        )}

      </div>
    </div>
  );
}
