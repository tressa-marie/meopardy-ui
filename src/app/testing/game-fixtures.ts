import { computed, signal } from '@angular/core';
import { vi } from 'vitest';
import { GameState } from '../models/game-state';
import { SubmittedAnswer } from '../admin/models/submitted-answer';

export const player = { id: 2, gameId: 8, name: 'Ada', score: 0, joinedAt: '', sessionToken: 'a'.repeat(64) };
export const clue = { id: 1, categoryId: 1, categoryName: 'Science', basePoints: 200, question: 'Question?', isAnswered: false };
export const answer: SubmittedAnswer = { id: 12, clueId: 1, playerId: 2, submittedAnswer: 'Answer', responseTimeMs: 250, isCorrect: false };

export function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 8, title: 'Test game', status: 'board', activeRoundId: 1,
    categories: [{ id: 1, name: 'Science', clues: [clue] }], rounds: [],
    serverNow: Date.now(), timing: null, activeClue: null, revealedAnswer: null,
    players: [player], standings: [{ ...player, rank: 1 }], winnerIds: [], ...overrides,
  };
}

export function gameStub(initial = makeState()) {
  const state = signal<GameState | null>(initial);
  const activeClue = computed(() => {
    const value = state();
    return value && ['clue_open', 'answering', 'reveal'].includes(value.status) ? value.activeClue : null;
  });
  return {
    state, activeClue, connected: signal(true), synchronized: signal(true), error: signal(''),
    answers: signal<SubmittedAnswer[]>([]), ownAnswer: signal<SubmittedAnswer | null>(null),
    remainingSeconds: signal(10), acceptingAnswers: signal(true),
    joinGame: vi.fn(), joinPlayerGame: vi.fn(),
    startGame: vi.fn().mockResolvedValue(undefined), selectClue: vi.fn().mockResolvedValue(undefined),
    closeClue: vi.fn().mockResolvedValue(undefined), revealClue: vi.fn().mockResolvedValue(undefined),
    setTheme: vi.fn().mockResolvedValue(undefined), sync: vi.fn().mockResolvedValue(undefined),
    submitAnswer: vi.fn().mockResolvedValue({ answerId: 12, duplicate: false }),
    onThemeChanged: vi.fn().mockReturnValue(() => undefined),
  };
}

export class FakeSocket {
  connected = false;
  private readonly listeners = new Map<string, Set<(payload?: any) => void>>();
  readonly emitWithAck = vi.fn(async (_event: string, _payload: unknown): Promise<any> => ({ ok: true, result: makeState() }));
  on(event: string, callback: (payload?: any) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return this;
  }
  off(event: string, callback: (payload?: any) => void) { this.listeners.get(event)?.delete(callback); return this; }
  receive(event: string, payload?: unknown) { for (const listener of this.listeners.get(event) ?? []) listener(payload); }
  connect() { this.connected = true; this.receive('connect'); return this; }
  disconnect() { this.connected = false; this.receive('disconnect'); return this; }
  timeout(_ms: number) { return this; }
}
