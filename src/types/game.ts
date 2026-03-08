export type VeggieType = 'carrot' | 'pepper' | 'tomato' | 'lettuce' | 'onion' | 'cabbage';

export interface Card {
  id: number;
  veggie: VeggieType;
  pointText: string;
  isFaceUp: boolean;
}

export interface Player {
  id: string;
  name: string;
  sessionId: string;
  cards: Card[];
  isHost: boolean;
  isConnected: boolean;
}

export type GamePhase = 'lobby' | 'playing' | 'results';

export interface GameRoom {
  id: string;
  hostId: string;
  phase: GamePhase;
  players: { [sessionId: string]: Player };
  playerOrder: string[];
  currentTurnIndex: number;
  // Firebase-safe flat structures
  drawPiles: { p0: Card[]; p1: Card[]; p2: Card[] };
  market: Record<string, Card | null>; // keys: "0_0", "0_1", "1_0" ...
  turnAction: 'idle' | 'selecting';
  createdAt: number;
  selectedMarketCards: string[];
}
