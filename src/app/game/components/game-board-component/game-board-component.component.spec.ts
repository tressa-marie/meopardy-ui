import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { GameBoardComponentComponent } from './game-board-component.component';
import { SocketService } from '../../../core/services/socket/socker.service';
import { clue, gameStub, makeState } from '../../../testing/game-fixtures';

describe('GameBoard clue transitions', () => {
  let game: ReturnType<typeof gameStub>;
  let component: GameBoardComponentComponent;
  beforeEach(() => {
    game = gameStub(makeState({ status: 'answering', activeClue: clue }));
    TestBed.configureTestingModule({ imports: [GameBoardComponentComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ gameId: '8' }) } } },
    ] });
    component = TestBed.createComponent(GameBoardComponentComponent).componentInstance;
  });

  it('marks answered through the shared persisted close transition, once', async () => {
    let complete!: () => void;
    game.closeClue.mockImplementation(() => new Promise<void>(resolve => complete = resolve));
    const pending = component.markAnswered();
    await component.markAnswered();
    await component.closeClue();
    expect(game.closeClue).toHaveBeenCalledExactlyOnceWith(8, 1);
    complete();
    await pending;
    expect(component.busy()).toBe(false);
  });

  it('keeps the active clue and displays a failed save', async () => {
    game.closeClue.mockRejectedValue(new Error('Could not save'));
    await component.markAnswered();
    expect(component.selectedClue?.id).toBe(1);
    expect(component.errorMessage()).toBe('Could not save');
    expect(game.sync).toHaveBeenCalled();
  });

  it('does not allow another selection while a clue is open', async () => {
    await component.selectClue({ ...clue, id: 3 });
    expect(game.selectClue).not.toHaveBeenCalled();
  });

  it('takes the game id from the route', () => expect(component.gameId).toBe(8));
});
