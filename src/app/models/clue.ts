export interface Clue {
  id: number;
  categoryId: number;
  categoryName: string;
  basePoints: number;
  question: string;
  correctAnswer: string;
  isAnswered: boolean;
}