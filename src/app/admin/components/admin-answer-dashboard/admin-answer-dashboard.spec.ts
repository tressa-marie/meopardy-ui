import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { AdminAnswerDashboardComponent } from './admin-answer-dashboard';
import { SocketService } from '../../../core/services/socket/socker.service';
import { OverrideAnswerResult, PlayerService } from '../../../player/services/player-api';
import { answer, clue, gameStub, makeState } from '../../../testing/game-fixtures';

describe('Persistent host grading', () => {
  let game: ReturnType<typeof gameStub>;
  let overrideAnswer: ReturnType<typeof vi.fn>;
  let component: AdminAnswerDashboardComponent;
  beforeEach(() => {
    game = gameStub(makeState({ status: 'answering', activeClue: clue }));
    game.answers.set([answer]);
    overrideAnswer = vi.fn();
    TestBed.configureTestingModule({ imports: [AdminAnswerDashboardComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: PlayerService, useValue: { overrideAnswer } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ gameId: '8' }) } } },
    ] });
    component = TestBed.createComponent(AdminAnswerDashboardComponent).componentInstance;
  });

  it('waits for persistence before syncing scores and blocks overlapping judgments', async () => {
    const saved = new Subject<OverrideAnswerResult>();
    overrideAnswer.mockReturnValue(saved);
    const pending = component.setAnswerCorrectness(answer, true);
    await component.setAnswerCorrectness(answer, false);
    expect(overrideAnswer).toHaveBeenCalledExactlyOnceWith(12, true);
    expect(component.submittedAnswers[0].isCorrect).toBe(false);
    expect(game.sync).not.toHaveBeenCalled();
    saved.next({ answerId: 12, playerId: 2, isCorrect: true, pointsAwarded: 200, newScore: 200 });
    await pending;
    expect(game.sync).toHaveBeenCalledOnce();
    expect(component.gradingIds().size).toBe(0);
  });

  it('keeps the saved result unchanged on failure and allows a retry', async () => {
    overrideAnswer.mockReturnValue(throwError(() => new Error('Save failed')));
    await component.setAnswerCorrectness(answer, true);
    expect(component.submittedAnswers[0].isCorrect).toBe(false);
    expect(component.errorMessage()).toBe('Save failed');
    expect(component.gradingIds().size).toBe(0);
  });

  it('retains the shared Settings card below the scores in the right column', () => {
    const fixture = TestBed.createComponent(AdminAnswerDashboardComponent);
    fixture.detectChanges();
    const sidebar: HTMLElement = fixture.nativeElement.querySelector('.dashboard-sidebar');
    expect(sidebar.children[0].classList).toContain('scoreboard-panel');
    expect(sidebar.children[1].tagName).toBe('APP-GAME-SETTINGS');
    expect(sidebar.querySelector('app-game-settings h2')?.textContent).toBe('Settings');
    expect(sidebar.querySelector('app-game-settings select')).not.toBeNull();
  });
});
