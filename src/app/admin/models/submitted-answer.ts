export interface SubmittedAnswer {
  id: number;
  clueId: number;
  playerId: number;
  playerName?: string;
  submittedAnswer: string;
  responseTimeMs: number;
  isCorrect: boolean | null;
  pointsAwarded?: number;
}
