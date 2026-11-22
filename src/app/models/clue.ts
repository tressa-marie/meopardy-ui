export interface Clue {
  id: number;
  categoryId: number;
  categoryName: string;
  basePoints: number;
  question: string;
  isAnswered: boolean;
  isPlayed?: boolean;
  timeLimitSeconds?: number;
}
