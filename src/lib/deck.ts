import type { Card, VeggieType } from '../types/game';
import { ALL_CARDS } from '../data/cards';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildDeck(playerCount: number): Card[] {
  const countPerVeggie: Record<number, number> = {
    2: 6, 3: 9, 4: 12, 5: 15, 6: 18,
  };
  const keep = countPerVeggie[playerCount] ?? 18;

  const veggies: VeggieType[] = ['carrot', 'pepper', 'tomato', 'lettuce', 'onion', 'cabbage'];
  const result: Card[] = [];

  for (const veggie of veggies) {
    const all = ALL_CARDS.filter(c => c.veggie === veggie);
    // Shuffle all 18 of this veggie then take `keep` — random subset each game
    const randomSubset = shuffle(all).slice(0, keep);
    result.push(...randomSubset);
  }

  console.log(`Built deck: ${result.length} cards for ${playerCount} players (${keep} per veggie × 6)`);

  return shuffle(result).map(c => ({ ...c, isFaceUp: true }));
}

export function splitIntoPiles(deck: Card[]): Card[][] {
  const third = Math.floor(deck.length / 3);
  return [
    deck.slice(0, third),
    deck.slice(third, third * 2),
    deck.slice(third * 2),
  ];
}

export function dealMarket(piles: Card[][]): {
  piles: Card[][];
  market: (Card | null)[][];
} {
  const newPiles = piles.map(p => [...p]);
  const market: (Card | null)[][] = [[null, null], [null, null], [null, null]];
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 2; row++) {
      if (newPiles[col].length > 0) {
        market[col][row] = { ...newPiles[col].shift()!, isFaceUp: false };
      }
    }
  }
  return { piles: newPiles, market };
}

export function refillMarket(
  piles: Card[][],
  market: (Card | null)[][]
): { piles: Card[][], market: (Card | null)[][] } {
  const newPiles = piles.map(p => [...p]);
  const newMarket = market.map(col => [...col]);

  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 2; row++) {
      if (newMarket[col][row] === null && newPiles[col].length > 0) {
        newMarket[col][row] = { ...newPiles[col].shift()!, isFaceUp: false };
      }
    }
    if (newPiles[col].length === 0) {
      let maxLen = 0;
      let maxIdx = -1;
      for (let i = 0; i < 3; i++) {
        if (newPiles[i].length > maxLen) {
          maxLen = newPiles[i].length;
          maxIdx = i;
        }
      }
      if (maxIdx >= 0 && newPiles[maxIdx].length > 1) {
        const half = Math.floor(newPiles[maxIdx].length / 2);
        newPiles[col] = newPiles[maxIdx].splice(half);
      }
    }
  }

  return { piles: newPiles, market: newMarket };
}

export function pilesToFirebase(piles: Card[][]): Record<string, Card[]> {
  return {
    p0: piles[0] ?? [],
    p1: piles[1] ?? [],
    p2: piles[2] ?? [],
  };
}

export function firebaseToPiles(obj: Record<string, Card[]> | Card[][] | null | undefined): Card[][] {
  if (!obj) return [[], [], []];
  if (Array.isArray(obj)) {
    return [
      Object.values((obj as any)[0] ?? {}),
      Object.values((obj as any)[1] ?? {}),
      Object.values((obj as any)[2] ?? {}),
    ];
  }
  return [
    Object.values((obj as any).p0 ?? {}),
    Object.values((obj as any).p1 ?? {}),
    Object.values((obj as any).p2 ?? {}),
  ];
}

export function marketToFirebase(market: (Card | null)[][]): Record<string, Card | null> {
  const obj: Record<string, Card | null> = {};
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 2; row++) {
      obj[`${col}_${row}`] = market[col][row] ?? null;
    }
  }
  return obj;
}

export function firebaseToMarket(
  obj: Record<string, Card | null> | (Card | null)[][] | null | undefined
): (Card | null)[][] {
  const market: (Card | null)[][] = [[null, null], [null, null], [null, null]];
  if (!obj) return market;
  if (Array.isArray(obj)) {
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 2; row++) {
        market[col][row] = (obj as any)[col]?.[row] ?? null;
      }
    }
    return market;
  }
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 2; row++) {
      market[col][row] = (obj as any)[`${col}_${row}`] ?? null;
    }
  }
  return market;
}
