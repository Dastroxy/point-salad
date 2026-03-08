import type { Card, Player, VeggieType } from '../types/game';

type VeggieCounts = Record<VeggieType, number>;

// ✅ Fix: Firebase may return cards as object, force to array
function toArray(cards: Card[] | Record<string, Card> | null | undefined): Card[] {
  if (!cards) return [];
  if (Array.isArray(cards)) return cards;
  return Object.values(cards);
}

export function getVeggieCounts(cards: Card[] | Record<string, Card> | null | undefined): VeggieCounts {
  const counts: VeggieCounts = { carrot: 0, pepper: 0, tomato: 0, lettuce: 0, onion: 0, cabbage: 0 };
  for (const c of toArray(cards)) {
    if (!c.isFaceUp) counts[c.veggie]++;
  }
  return counts;
}

export function scorePointCard(
  cardId: number,
  myVeggies: VeggieCounts,
  allPlayers: Player[],
  mySessionId: string
): number {
  const allVeggies = allPlayers.map(p => getVeggieCounts(p.cards));
  const myIndex = allPlayers.findIndex(p => p.sessionId === mySessionId);

  const c = myVeggies;

  const hasMost = (v: VeggieType) => {
    const myCount = c[v];
    const others = allVeggies.filter((_, i) => i !== myIndex).map(a => a[v]);
    return myCount >= Math.max(...others, 0) && myCount > 0;
  };
  const hasFewest = (v: VeggieType) => {
    const myCount = c[v];
    const others = allVeggies.filter((_, i) => i !== myIndex).map(a => a[v]);
    return myCount <= Math.min(...others, Infinity);
  };
  const hasMostTotal = () => {
    const myT = Object.values(c).reduce((a, b) => a + b, 0);
    const others = allVeggies.filter((_, i) => i !== myIndex).map(a => Object.values(a).reduce((x, y) => x + y, 0));
    return myT >= Math.max(...others, 0) && myT > 0;
  };
  const hasFewestTotal = () => {
    const myT = Object.values(c).reduce((a, b) => a + b, 0);
    const others = allVeggies.filter((_, i) => i !== myIndex).map(a => Object.values(a).reduce((x, y) => x + y, 0));
    return myT <= Math.min(...others, Infinity);
  };

  const pairs = (v: VeggieType) => Math.floor(c[v] / 2);
  const sets3 = (v: VeggieType) => Math.floor(c[v] / 3);
  const pairsOf2 = (a: VeggieType, b: VeggieType) => Math.min(c[a], c[b]);
  const pairsOf3 = (a: VeggieType, b: VeggieType, d: VeggieType) => Math.min(c[a], c[b], c[d]);
  const setsAll6 = () => Math.min(...Object.values(c));

  const scores: Record<number, () => number> = {
    1: () => c.carrot * 2, 2: () => c.pepper * 2, 3: () => c.tomato * 2,
    4: () => c.lettuce * 2, 5: () => c.onion * 2, 6: () => c.cabbage * 2,
    7: () => pairs('carrot') * 5, 8: () => pairs('pepper') * 5,
    9: () => pairs('tomato') * 5, 10: () => pairs('lettuce') * 5,
    11: () => pairs('onion') * 5, 12: () => pairs('cabbage') * 5,
    13: () => sets3('carrot') * 8, 14: () => sets3('pepper') * 8,
    15: () => sets3('tomato') * 8, 16: () => sets3('lettuce') * 8,
    17: () => sets3('onion') * 8, 18: () => sets3('cabbage') * 8,
    19: () => pairsOf2('carrot','onion') * 5,
    20: () => pairsOf2('carrot','pepper') * 5,
    21: () => pairsOf2('carrot','tomato') * 5,
    22: () => pairsOf2('carrot','lettuce') * 5,
    23: () => pairsOf2('carrot','cabbage') * 5,
    24: () => pairsOf2('pepper','tomato') * 5,
    25: () => pairsOf2('pepper','lettuce') * 5,
    26: () => pairsOf2('pepper','onion') * 5,
    27: () => pairsOf2('pepper','cabbage') * 5,
    28: () => pairsOf2('tomato','lettuce') * 5,
    29: () => pairsOf2('tomato','onion') * 5,
    30: () => pairsOf2('tomato','cabbage') * 5,
    31: () => pairsOf2('lettuce','onion') * 5,
    32: () => pairsOf2('lettuce','cabbage') * 5,
    33: () => pairsOf2('onion','cabbage') * 5,
    34: () => pairsOf3('carrot','pepper','tomato') * 8,
    35: () => pairsOf3('carrot','pepper','lettuce') * 8,
    36: () => pairsOf3('carrot','pepper','onion') * 8,
    37: () => pairsOf3('carrot','pepper','cabbage') * 8,
    38: () => pairsOf3('carrot','tomato','lettuce') * 8,
    39: () => pairsOf3('carrot','tomato','onion') * 8,
    40: () => pairsOf3('carrot','tomato','cabbage') * 8,
    41: () => pairsOf3('carrot','lettuce','onion') * 8,
    42: () => pairsOf3('carrot','lettuce','cabbage') * 8,
    43: () => pairsOf3('carrot','onion','cabbage') * 8,
    44: () => pairsOf3('pepper','tomato','lettuce') * 8,
    45: () => pairsOf3('pepper','tomato','onion') * 8,
    46: () => pairsOf3('pepper','tomato','cabbage') * 8,
    47: () => pairsOf3('pepper','lettuce','onion') * 8,
    48: () => pairsOf3('pepper','lettuce','cabbage') * 8,
    49: () => pairsOf3('pepper','onion','cabbage') * 8,
    50: () => pairsOf3('tomato','lettuce','onion') * 8,
    51: () => pairsOf3('tomato','lettuce','cabbage') * 8,
    52: () => pairsOf3('tomato','onion','cabbage') * 8,
    53: () => pairsOf3('lettuce','onion','cabbage') * 8,
    54: () => c.carrot * 3 - c.cabbage * 2,
    55: () => c.pepper * 3 - c.carrot * 2,
    56: () => c.tomato * 3 - c.lettuce * 2,
    57: () => c.lettuce * 3 - c.onion * 2,
    58: () => c.onion * 3 - c.tomato * 2,
    59: () => c.cabbage * 3 - c.pepper * 2,
    60: () => c.carrot * 3 - c.onion - c.pepper,
    61: () => c.pepper * 3 - c.tomato - c.carrot,
    62: () => c.tomato * 3 - c.onion - c.lettuce,
    63: () => c.lettuce * 3 - c.pepper - c.cabbage,
    64: () => c.onion * 3 - c.carrot - c.tomato,
    65: () => c.cabbage * 3 - c.lettuce - c.onion,
    66: () => c.carrot * 4 - c.pepper * 2 - c.tomato * 2,
    67: () => c.pepper * 4 - c.onion * 2 - c.lettuce * 2,
    68: () => c.tomato * 4 - c.cabbage * 2 - c.carrot * 2,
    69: () => c.lettuce * 4 - c.tomato * 2 - c.onion * 2,
    70: () => c.onion * 4 - c.lettuce * 2 - c.pepper * 2,
    71: () => c.cabbage * 4 - c.carrot * 2 - c.tomato * 2,
    72: () => c.carrot * 2 + c.lettuce * 2 - c.onion * 4,
    73: () => c.pepper * 2 + c.tomato * 2 - c.cabbage * 4,
    74: () => c.tomato * 2 + c.onion * 2 - c.pepper * 4,
    75: () => c.lettuce * 2 + c.cabbage * 2 - c.carrot * 4,
    76: () => c.onion * 2 + c.pepper * 2 - c.lettuce * 4,
    77: () => c.cabbage * 2 + c.carrot * 2 - c.tomato * 4,
    78: () => (c.carrot % 2 === 0 && c.carrot > 0 ? 7 : c.carrot > 0 ? 3 : 0),
    79: () => (c.pepper % 2 === 0 && c.pepper > 0 ? 7 : c.pepper > 0 ? 3 : 0),
    80: () => (c.tomato % 2 === 0 && c.tomato > 0 ? 7 : c.tomato > 0 ? 3 : 0),
    81: () => (c.lettuce % 2 === 0 && c.lettuce > 0 ? 7 : c.lettuce > 0 ? 3 : 0),
    82: () => (c.onion % 2 === 0 && c.onion > 0 ? 7 : c.onion > 0 ? 3 : 0),
    83: () => (c.cabbage % 2 === 0 && c.cabbage > 0 ? 7 : c.cabbage > 0 ? 3 : 0),
    84: () => (hasMost('carrot') ? 10 : 0),
    85: () => (hasMost('pepper') ? 10 : 0),
    86: () => (hasMost('tomato') ? 10 : 0),
    87: () => (hasMost('lettuce') ? 10 : 0),
    88: () => (hasMost('onion') ? 10 : 0),
    89: () => (hasMost('cabbage') ? 10 : 0),
    90: () => (hasFewest('carrot') ? 7 : 0),
    91: () => (hasFewest('pepper') ? 7 : 0),
    92: () => (hasFewest('tomato') ? 7 : 0),
    93: () => (hasFewest('lettuce') ? 7 : 0),
    94: () => (hasFewest('onion') ? 7 : 0),
    95: () => (hasFewest('cabbage') ? 7 : 0),
    96: () => (hasMostTotal() ? 10 : 0),
    97: () => (hasFewestTotal() ? 7 : 0),
    98: () => setsAll6() * 12,
    99: () => (['carrot','pepper','tomato','lettuce','onion','cabbage'] as VeggieType[]).filter(v => c[v] >= 2).length * 3,
    100: () => (['carrot','pepper','tomato','lettuce','onion','cabbage'] as VeggieType[]).filter(v => c[v] >= 3).length * 5,
    101: () => (['carrot','pepper','tomato','lettuce','onion','cabbage'] as VeggieType[]).filter(v => c[v] === 0).length * 5,
    102: () => pairsOf2('lettuce','tomato'),
    103: () => pairsOf2('onion','pepper'),
    104: () => pairsOf2('carrot','lettuce'),
    105: () => pairsOf2('tomato','cabbage'),
    106: () => pairsOf2('pepper','onion'),
    107: () => pairsOf2('carrot','tomato'),
    108: () => pairsOf2('lettuce','onion'),
  };

  return scores[cardId]?.() ?? 0;
}

export function calculateTotalScore(player: Player, allPlayers: Player[]): number {
  const cards = toArray(player.cards);
  const veggies = getVeggieCounts(cards);
  const pointCards = cards.filter(c => c.isFaceUp);
  return pointCards.reduce(
    (sum, card) => sum + scorePointCard(card.id, veggies, allPlayers, player.sessionId),
    0
  );
}
