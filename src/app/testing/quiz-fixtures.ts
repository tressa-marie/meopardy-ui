import { QuizImport } from '../game/models/quiz-import';

export function quizFixture(): QuizImport {
  return {
    title: 'My Quiz',
    rounds: [{ name: 'Round 1', categories: [{ name: 'Science', clues: [{
      question: 'Which planet is known as the Red Planet?', correctAnswer: 'Mars',
      acceptableAnswers: ['the planet mars'], basePoints: 100, timeLimitSeconds: 40,
    }] }] }],
  };
}

export function quizFile(quiz: unknown = quizFixture(), name = 'quiz.json'): File {
  return new File([JSON.stringify(quiz)], name, { type: 'application/json' });
}
