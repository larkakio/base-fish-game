// Type declarations for GameEngine

export interface GameOptions {
  onScoreUpdate?: (score: number) => void;
  onMovesUpdate?: (moves: number) => void;
  onLevelComplete?: (level: number, score: number) => void;
  onGameOver?: (score: number) => void;
}

export class FishdomGame {
  constructor(container: HTMLElement | null, options?: GameOptions);
  start(level?: number, character?: string): void;
  destroy(): void;
}

export default FishdomGame;
