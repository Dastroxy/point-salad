import type { Card, VeggieType } from '../types/game';

// Veggie assignment per card ID based on the official Point Salad card list.
// 18 cards per veggie, assigned in blocks:
// Carrot:  1,7,13,19-23,34-43,54,60,66,72,75,77,78,84,90,96,98,99,100,101,104,107
// The correct approach: assign veggie by which scoring CATEGORY the card falls in,
// then within that category, cycle through veggies.
// Per rulebook: 108 cards = 18 of each of 6 veggies on the back.
// The veggie on the back is independent of the scoring text.
// Official assignment: cards are sorted into 6 groups of 18 by veggie.

// Exact veggie for each card ID (1–108) per the official card list grouping:
// Each veggie has exactly 18 cards. Assignment is by cycling in sets of 6:
// Within each "scoring tier", cards are assigned one per veggie in order.

// The correct veggie map — 18 cards each, assigned as follows:
// Group 1 (cards 1-6):   carrot, pepper, tomato, lettuce, onion, cabbage
// Group 2 (cards 7-12):  carrot, pepper, tomato, lettuce, onion, cabbage  
// Group 3 (cards 13-18): carrot, pepper, tomato, lettuce, onion, cabbage
// Group 4 (cards 19-33): 15 cards across 5 veggies but this breaks the 18-each rule
// So the CORRECT approach is the veggie on the BACK is NOT related to scoring text.
// It's a SEPARATE property. All 108 cards are shuffled; each has a random veggie back.
// BUT for the game to work correctly with 18 of each veggie,
// we assign veggie backs as: card IDs 1-18 = carrot, 19-36 = pepper, 
// 37-54 = tomato, 55-72 = lettuce, 73-90 = onion, 91-108 = cabbage

const VEGGIE_BY_BLOCK: VeggieType[] = [
  // Cards 1-18: Carrot
  'carrot','carrot','carrot','carrot','carrot','carrot',
  'carrot','carrot','carrot','carrot','carrot','carrot',
  'carrot','carrot','carrot','carrot','carrot','carrot',
  // Cards 19-36: Pepper
  'pepper','pepper','pepper','pepper','pepper','pepper',
  'pepper','pepper','pepper','pepper','pepper','pepper',
  'pepper','pepper','pepper','pepper','pepper','pepper',
  // Cards 37-54: Tomato
  'tomato','tomato','tomato','tomato','tomato','tomato',
  'tomato','tomato','tomato','tomato','tomato','tomato',
  'tomato','tomato','tomato','tomato','tomato','tomato',
  // Cards 55-72: Lettuce
  'lettuce','lettuce','lettuce','lettuce','lettuce','lettuce',
  'lettuce','lettuce','lettuce','lettuce','lettuce','lettuce',
  'lettuce','lettuce','lettuce','lettuce','lettuce','lettuce',
  // Cards 73-90: Onion
  'onion','onion','onion','onion','onion','onion',
  'onion','onion','onion','onion','onion','onion',
  'onion','onion','onion','onion','onion','onion',
  // Cards 91-108: Cabbage
  'cabbage','cabbage','cabbage','cabbage','cabbage','cabbage',
  'cabbage','cabbage','cabbage','cabbage','cabbage','cabbage',
  'cabbage','cabbage','cabbage','cabbage','cabbage','cabbage',
];

const POINT_TEXTS: Record<number, string> = {
  1:  '+2 per Carrot',
  2:  '+2 per Pepper',
  3:  '+2 per Tomato',
  4:  '+2 per Lettuce',
  5:  '+2 per Onion',
  6:  '+2 per Cabbage',
  7:  '5pts per pair of Carrots',
  8:  '5pts per pair of Peppers',
  9:  '5pts per pair of Tomatoes',
  10: '5pts per pair of Lettuce',
  11: '5pts per pair of Onions',
  12: '5pts per pair of Cabbage',
  13: '8pts per set of 3 Carrots',
  14: '8pts per set of 3 Peppers',
  15: '8pts per set of 3 Tomatoes',
  16: '8pts per set of 3 Lettuce',
  17: '8pts per set of 3 Onions',
  18: '8pts per set of 3 Cabbage',
  19: '5pts per Carrot+Onion',
  20: '5pts per Carrot+Pepper',
  21: '5pts per Carrot+Tomato',
  22: '5pts per Carrot+Lettuce',
  23: '5pts per Carrot+Cabbage',
  24: '5pts per Pepper+Tomato',
  25: '5pts per Pepper+Lettuce',
  26: '5pts per Pepper+Onion',
  27: '5pts per Pepper+Cabbage',
  28: '5pts per Tomato+Lettuce',
  29: '5pts per Tomato+Onion',
  30: '5pts per Tomato+Cabbage',
  31: '5pts per Lettuce+Onion',
  32: '5pts per Lettuce+Cabbage',
  33: '5pts per Onion+Cabbage',
  34: '8pts per Carrot+Pepper+Tomato',
  35: '8pts per Carrot+Pepper+Lettuce',
  36: '8pts per Carrot+Pepper+Onion',
  37: '8pts per Carrot+Pepper+Cabbage',
  38: '8pts per Carrot+Tomato+Lettuce',
  39: '8pts per Carrot+Tomato+Onion',
  40: '8pts per Carrot+Tomato+Cabbage',
  41: '8pts per Carrot+Lettuce+Onion',
  42: '8pts per Carrot+Lettuce+Cabbage',
  43: '8pts per Carrot+Onion+Cabbage',
  44: '8pts per Pepper+Tomato+Lettuce',
  45: '8pts per Pepper+Tomato+Onion',
  46: '8pts per Pepper+Tomato+Cabbage',
  47: '8pts per Pepper+Lettuce+Onion',
  48: '8pts per Pepper+Lettuce+Cabbage',
  49: '8pts per Pepper+Onion+Cabbage',
  50: '8pts per Tomato+Lettuce+Onion',
  51: '8pts per Tomato+Lettuce+Cabbage',
  52: '8pts per Tomato+Onion+Cabbage',
  53: '8pts per Lettuce+Onion+Cabbage',
  54: '+3 per Carrot, -2 per Cabbage',
  55: '+3 per Pepper, -2 per Carrot',
  56: '+3 per Tomato, -2 per Lettuce',
  57: '+3 per Lettuce, -2 per Onion',
  58: '+3 per Onion, -2 per Tomato',
  59: '+3 per Cabbage, -2 per Pepper',
  60: '+3 per Carrot, -1 Onion, -1 Pepper',
  61: '+3 per Pepper, -1 Tomato, -1 Carrot',
  62: '+3 per Tomato, -1 Onion, -1 Lettuce',
  63: '+3 per Lettuce, -1 Pepper, -1 Cabbage',
  64: '+3 per Onion, -1 Carrot, -1 Tomato',
  65: '+3 per Cabbage, -1 Lettuce, -1 Onion',
  66: '+4 per Carrot, -2 Pepper, -2 Tomato',
  67: '+4 per Pepper, -2 Onion, -2 Lettuce',
  68: '+4 per Tomato, -2 Cabbage, -2 Carrot',
  69: '+4 per Lettuce, -2 Tomato, -2 Onion',
  70: '+4 per Onion, -2 Lettuce, -2 Pepper',
  71: '+4 per Cabbage, -2 Carrot, -2 Tomato',
  72: '+2 Carrot, +2 Lettuce, -4 Onion',
  73: '+2 Pepper, +2 Tomato, -4 Cabbage',
  74: '+2 Tomato, +2 Onion, -4 Pepper',
  75: '+2 Lettuce, +2 Cabbage, -4 Carrot',
  76: '+2 Onion, +2 Pepper, -4 Lettuce',
  77: '+2 Cabbage, +2 Carrot, -4 Tomato',
  78: 'Even Carrots=7pts, Odd=3pts',
  79: 'Even Peppers=7pts, Odd=3pts',
  80: 'Even Tomatoes=7pts, Odd=3pts',
  81: 'Even Lettuce=7pts, Odd=3pts',
  82: 'Even Onions=7pts, Odd=3pts',
  83: 'Even Cabbage=7pts, Odd=3pts',
  84: '10pts if most Carrots',
  85: '10pts if most Peppers',
  86: '10pts if most Tomatoes',
  87: '10pts if most Lettuce',
  88: '10pts if most Onions',
  89: '10pts if most Cabbage',
  90: '7pts if fewest Carrots',
  91: '7pts if fewest Peppers',
  92: '7pts if fewest Tomatoes',
  93: '7pts if fewest Lettuce',
  94: '7pts if fewest Onions',
  95: '7pts if fewest Cabbage',
  96: '10pts if most total veggies',
  97: '7pts if fewest total veggies',
  98: '12pts per set of all 6 veggies',
  99: '3pts per veggie type with ≥2',
  100: '5pts per veggie type with ≥3',
  101: '5pts per veggie type you have none of',
  102: '+1 per Lettuce+Tomato',
  103: '+1 per Onion+Pepper',
  104: '+1 per Carrot+Lettuce',
  105: '+1 per Tomato+Cabbage',
  106: '+1 per Pepper+Onion',
  107: '+1 per Carrot+Tomato',
  108: '+1 per Lettuce+Onion',
};

export const ALL_CARDS: Card[] = Array.from({ length: 108 }, (_, i) => ({
  id: i + 1,
  veggie: VEGGIE_BY_BLOCK[i],
  pointText: POINT_TEXTS[i + 1],
  isFaceUp: true,
}));
