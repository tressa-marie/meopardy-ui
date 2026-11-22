import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PlayerAnswerComponent } from './player-answer';
import { SocketService } from '../../../core/services/socket/socker.service';
import { PlayerSessionService } from '../../services/player-session.service';
import { answer, clue, gameStub, makeState } from '../../../testing/game-fixtures';

describe('Player answer lifecycle', () => {
  let game: ReturnType<typeof gameStub>;
  let fixture: ReturnType<typeof TestBed.createComponent<PlayerAnswerComponent>>;
  let component: PlayerAnswerComponent;

  beforeEach(() => {
    game = gameStub(makeState({ status: 'answering', activeClue: clue }));
    TestBed.configureTestingModule({ imports: [PlayerAnswerComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: PlayerSessionService, useValue: { getGameId: () => 8 } },
    ] });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(PlayerAnswerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('restores a saved answer after refresh and prevents resubmission', async () => {
    game.ownAnswer.set(answer);
    component.answer = 'Changed answer';
    await component.submitAnswer();
    expect(component.submitted()).toBe(true);
    expect(game.submitAnswer).not.toHaveBeenCalled();
  });

  it('blocks repeated clicks while submitting and sends no timing or identity', async () => {
    let accept!: () => void;
    game.submitAnswer.mockImplementation(() => new Promise<void>(resolve => accept = resolve));
    component.answer = '  Answer  ';
    const pending = component.submitAnswer();
    await component.submitAnswer();
    expect(game.submitAnswer).toHaveBeenCalledExactlyOnceWith(1, 'Answer');
    accept();
    await pending;
    expect(component.submitted()).toBe(true);
  });

  it('blocks answering when the server deadline expires', async () => {
    component.answer = 'Answer';
    game.acceptingAnswers.set(false);
    await component.submitAnswer();
    expect(game.submitAnswer).not.toHaveBeenCalled();
  });

  it('shows the expired question without revealing or allowing another answer', async () => {
    game.state.set(makeState({ status: 'awaiting_reveal', activeClue: clue }));
    game.acceptingAnswers.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Answers are closed');
    expect(fixture.nativeElement.textContent).toContain(clue.question);
    expect(fixture.nativeElement.querySelector('.submit-button').disabled).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('Answer:');
    expect(game.revealClue).not.toHaveBeenCalled();
  });

  it('does not mark a new clue submitted when an old response arrives', async () => {
    let accept!: () => void;
    game.submitAnswer.mockImplementation(() => new Promise<void>(resolve => accept = resolve));
    component.answer = 'Answer';
    const pending = component.submitAnswer();
    game.state.set(makeState({ status: 'answering', activeClue: { ...clue, id: 3 } }));
    fixture.detectChanges();
    accept();
    await pending;
    expect(component.submitted()).toBe(false);
    expect(component.answer).toBe('');
  });

  it('recovers an accepted answer when its acknowledgment times out', async () => {
    component.answer = 'Answer';
    game.submitAnswer.mockRejectedValue(new Error('No acknowledgment'));
    game.sync.mockImplementation(async () => { game.ownAnswer.set(answer); });
    await component.submitAnswer();
    expect(game.sync).toHaveBeenCalledOnce();
    expect(component.submitted()).toBe(true);
  });
});
