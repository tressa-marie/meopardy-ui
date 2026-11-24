export interface QuizImport {
  title: string;
  rounds: {
    name: string;
    categories: {
      name: string;
      clues: {
        question: string;
        correctAnswer: string;
        acceptableAnswers?: string[];
        basePoints: number;
        timeLimitSeconds?: number;
      }[];
    }[];
  }[];
}

export interface QuizPreview {
  title: string;
  roundCount: number;
  categoryCount: number;
  questionCount: number;
}

export interface QuizIssue {
  path: string;
  message: string;
}

export interface QuizImportResponse {
  message: string;
  gameId: number;
  joinCode: string;
}

export class UnexpectedQuizImportResponseError extends Error {
  constructor() { super('The server returned an unexpected import response.'); }
}
