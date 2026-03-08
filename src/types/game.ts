export type VeggieType = 'carrot' | 'pepper' | 'tomato' | 'lettuce' | 'onion' | 'cabbage';

export interface Card {
  id: number;
  veggie: VeggieType;
  pointText: string;
  isFaceUp: boolean;
}

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  cards: Card[];
  isHost: boolean;
  isConnected: boolean;
}

export interface GameRoom {
  id: string;
  hostId: string;
  phase: 'lobby' | 'playing' | 'results';
  players: Record<string, Player>;
  playerOrder: string[];
  currentTurnIndex: number;
  drawPiles: Record<string, Card[]>;
  market: Record<string, Card | null>;
  turnAction: string;
  createdAt: number;
  selectedMarketCards: string[];
  hasFlippedThisTurn?: boolean;
}
