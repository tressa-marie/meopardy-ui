import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { GameBoardComponentComponent } from './game-board-component.component';
import { SocketService } from '../../../core/services/socket/socker.service';
import { clue, gameStub, makeState } from '../../../testing/game-fixtures';

describe('GameBoard clue transitions', () => {
  let game: ReturnType<typeof gameStub>;
  let component: GameBoardComponentComponent;
  let fixture: ComponentFixture<GameBoardComponentComponent>;
  beforeEach(() => {
    game = gameStub(makeState({ status: 'answering', activeClue: clue }));
    TestBed.configureTestingModule({ imports: [GameBoardComponentComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ gameId: '8' }) } } },
    ] });
    fixture = TestBed.createComponent(GameBoardComponentComponent);
    component = fixture.componentInstance;
  });

  it('persists the close transition once while a save is pending', async () => {
    let complete!: () => void;
    game.closeClue.mockImplementation(() => new Promise<void>(resolve => complete = resolve));
    const pending = component.closeClue();
    await component.closeClue();
    expect(game.closeClue).toHaveBeenCalledExactlyOnceWith(8, 1);
    complete();
    await pending;
    expect(component.busy()).toBe(false);
  });

  it('keeps the active clue and displays a failed save', async () => {
    game.closeClue.mockRejectedValue(new Error('Could not save'));
    await component.closeClue();
    expect(component.selectedClue?.id).toBe(1);
    expect(component.errorMessage()).toBe('Could not save');
    expect(game.sync).toHaveBeenCalled();
  });

  it('does not allow another selection while a clue is open', async () => {
    await component.selectClue({ ...clue, id: 3 });
    expect(game.selectClue).not.toHaveBeenCalled();
  });

  it('keeps the expired question visible and reveals only when the host clicks Reveal Answer', async () => {
    game.state.set(makeState({ status: 'awaiting_reveal', activeClue: clue }));
    game.remainingSeconds.set(0);
    game.revealClue.mockImplementation(async () => {
      game.state.set(makeState({ status: 'reveal', activeClue: clue, revealedAnswer: 'Secret answer' }));
    });
    fixture.detectChanges();
    const card: HTMLElement = fixture.nativeElement.querySelector('.clue-modal');
    expect(card.textContent).toContain('Time is up');
    expect(card.textContent).toContain(clue.question);
    expect(card.textContent).not.toContain('Secret answer');
    expect(game.revealClue).not.toHaveBeenCalled();
    const revealButton = card.querySelector<HTMLButtonElement>('.modal-actions button')!;
    expect(revealButton.textContent).toBe('Reveal Answer');
    expect(revealButton.disabled).toBe(false);
    revealButton.click();
    await fixture.whenStable();
    expect(game.revealClue).toHaveBeenCalledExactlyOnceWith(8, 1);
    expect(card.textContent).toContain('Secret answer');
    expect(revealButton.disabled).toBe(true);
  });

  it('takes the game id from the route', () => expect(component.gameId).toBe(8));
});
