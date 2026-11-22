import { TestBed } from '@angular/core/testing';
import { SocketService, SOCKET_FACTORY } from './socker.service';
import { PlayerSessionService } from '../../../player/services/player-session.service';
import { answer, clue, FakeSocket, makeState, player } from '../../../testing/game-fixtures';

describe('SocketService game recovery and commands', () => {
  let socket: FakeSocket;
  let service: SocketService;
  const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

  beforeEach(() => {
    socket = new FakeSocket();
    TestBed.configureTestingModule({ providers: [
      { provide: SOCKET_FACTORY, useValue: () => socket },
      { provide: PlayerSessionService, useValue: { getPlayer: () => player, updatePlayer: vi.fn() } },
    ] });
    service = TestBed.inject(SocketService);
  });

  it('rejoins with the saved session on reconnect and restores the accepted answer', async () => {
    const snapshot = makeState({ status: 'answering', activeClue: clue, ownAnswer: answer,
      timing: { clueId: 1, startedAt: Date.now(), deadlineAt: Date.now() + 10000, closedAt: null, revealedAt: null } });
    socket.emitWithAck.mockResolvedValue({ ok: true, result: snapshot });
    service.joinPlayerGame(8);
    await settle();
    expect(service.ownAnswer()?.id).toBe(12);
    socket.disconnect();
    expect(service.synchronized()).toBe(false);
    expect(service.acceptingAnswers()).toBe(false);
    socket.connect();
    await settle();
    expect(socket.emitWithAck).toHaveBeenLastCalledWith('player:joinGame', {
      gameId: 8, role: 'player', sessionToken: player.sessionToken,
    });
    expect(service.synchronized()).toBe(true);
    expect(service.ownAnswer()?.id).toBe(12);
  });

  it('sends only a clue ID and never forwards an answer key', async () => {
    service.joinGame(8);
    await settle();
    await service.selectClue(8, { ...clue, correctAnswer: 'secret' } as typeof clue);
    expect(socket.emitWithAck).toHaveBeenLastCalledWith('game:clueSelected', { gameId: 8, clue: { id: 1 } });
  });

  it('uses the server identity and timing for submission', async () => {
    service.joinPlayerGame(8);
    await settle();
    await service.submitAnswer(1, 'Answer');
    expect(socket.emitWithAck).toHaveBeenLastCalledWith('game:answerSubmitted', { clueId: 1, submittedAnswer: 'Answer' });
  });

  it('deduplicates saved answer snapshots and normalizes SQLite correctness', async () => {
    service.joinGame(8);
    await settle();
    socket.receive('game:state', makeState({ status: 'answering', activeClue: clue }));
    socket.receive('game:answers', { gameId: 8, clueId: 1, answers: [{ ...answer, isCorrect: 0 }, { ...answer, isCorrect: 1 }] });
    expect(service.answers()).toHaveLength(1);
    expect(service.answers()[0].isCorrect).toBe(true);
    socket.receive('game:state', makeState());
    expect(service.activeClue()).toBeNull();
    expect(service.answers()).toEqual([]);
  });

  it('ignores snapshots from another game and strips legacy answer keys', async () => {
    service.joinGame(8);
    await settle();
    socket.receive('game:state', makeState({ id: 9 }));
    expect(service.state()?.id).toBe(8);
    socket.receive('game:state', makeState({ status: 'answering', activeClue: { ...clue, correctAnswer: 'secret' } as typeof clue }));
    expect(service.activeClue()).not.toHaveProperty('correctAnswer');
  });

  it('uses the server clock offset and locks at the deadline and on reveal', async () => {
    const time = Date.now();
    socket.emitWithAck.mockResolvedValue({ ok: true, result: makeState({
      status: 'answering', activeClue: clue, serverNow: time + 60000,
      timing: { clueId: 1, startedAt: time + 60000, deadlineAt: time + 65000, closedAt: null, revealedAt: null },
    }) });
    service.joinPlayerGame(8);
    await settle();
    expect(service.remainingSeconds()).toBe(5);
    expect(service.acceptingAnswers()).toBe(true);
    service.now.update(now => now + 5000);
    expect(service.remainingSeconds()).toBe(0);
    expect(service.acceptingAnswers()).toBe(false);
    socket.receive('game:state', makeState({ status: 'reveal', activeClue: clue }));
    expect(service.acceptingAnswers()).toBe(false);
  });

  it('rejects failed acknowledgments without pretending the game started', async () => {
    service.joinGame(8);
    await settle();
    socket.emitWithAck.mockResolvedValue({ ok: false, message: 'Game has no playable rounds' });
    await expect(service.startGame(8)).rejects.toThrow('Game has no playable rounds');
    expect(service.state()?.status).toBe('board');
  });

  it('keeps the question and saved submissions visible while awaiting a manual reveal', async () => {
    service.joinGame(8);
    await settle();
    socket.receive('game:state', makeState({ status: 'answering', activeClue: clue }));
    socket.receive('game:answers', { gameId: 8, clueId: 1, answers: [answer] });
    socket.receive('game:state', makeState({ status: 'awaiting_reveal', activeClue: clue }));
    expect(service.activeClue()?.id).toBe(1);
    expect(service.answers()).toHaveLength(1);
    expect(service.state()?.revealedAnswer).toBeNull();
    expect(service.acceptingAnswers()).toBe(false);
  });

  it('does not remove other theme listeners when unsubscribing', () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribe = service.onThemeChanged(first);
    service.onThemeChanged(second);
    unsubscribe();
    socket.receive('game:themeChanged', { theme: 'classic' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('classic');
  });
});
