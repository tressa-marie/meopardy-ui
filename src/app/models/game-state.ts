import { GameBoard } from './board';
import { Clue } from './clue';
import { Player } from './player';
import { SubmittedAnswer } from '../admin/models/submitted-answer';

export type GamePhase = 'setup' | 'board' | 'clue_open' | 'answering' | 'awaiting_reveal' | 'reveal' | 'finished';

export interface GameState extends GameBoard {
  status: GamePhase;
  activeRoundId: number | null;
  rounds: { id: number; name: string; categories: GameBoard['categories'] }[];
  serverNow: number;
  timing: {
    clueId: number;
    startedAt: number | null;
    deadlineAt: number | null;
    closedAt: number | null;
    revealedAt: number | null;
  } | null;
  activeClue: Clue | null;
  revealedAnswer: string | null;
  players: Player[];
  standings: (Player & { rank: number })[];
  winnerIds: number[];
  player?: Player;
  ownAnswer?: SubmittedAnswer | null;
}

export interface AnswerReceipt {
  answerId: number;
  gameId: number;
  duplicate: boolean;
  isCorrect: boolean;
  pointsAwarded: number;
}

// Construct public clues explicitly: legacy answer keys must never enter player state.
export function publicClue(clue: Clue): Clue {
  return {
    id: clue.id, categoryId: clue.categoryId, categoryName: clue.categoryName ?? '',
    question: clue.question, basePoints: clue.basePoints,
    isAnswered: Boolean(clue.isAnswered), isPlayed: Boolean(clue.isPlayed),
    timeLimitSeconds: clue.timeLimitSeconds,
  };
}

export function normalizeAnswer(answer: SubmittedAnswer): SubmittedAnswer {
  return { ...answer, isCorrect: answer.isCorrect == null ? null : Boolean(answer.isCorrect) };
}

export function normalizeState(state: GameState): GameState {
  const categories = (items: GameBoard['categories']) => items.map(category => ({
    ...category, clues: category.clues.map(publicClue),
  }));
  return {
    ...state, categories: categories(state.categories),
    rounds: state.rounds.map(round => ({ ...round, categories: categories(round.categories) })),
    activeClue: state.activeClue ? publicClue(state.activeClue) : null,
    ownAnswer: state.ownAnswer ? normalizeAnswer(state.ownAnswer) : state.ownAnswer,
  };
}
