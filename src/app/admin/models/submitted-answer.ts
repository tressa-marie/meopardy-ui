export interface SubmittedAnswer {
  clueId: number;
  playerId: number;
  playerName?: string;
  submittedAnswer: string;
  responseTimeMs: number;
  isCorrect: boolean | null;
}
