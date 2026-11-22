import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { PlayerLobbyComponent } from './player-lobby-component';
import { SocketService } from '../../../core/services/socket/socker.service';
import { gameStub, makeState } from '../../../testing/game-fixtures';

describe('PlayerLobby start confirmation', () => {
  let game: ReturnType<typeof gameStub>;
  let component: PlayerLobbyComponent;
  let navigate: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    game = gameStub(makeState({ status: 'setup' }));
    TestBed.configureTestingModule({ imports: [PlayerLobbyComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ gameId: '8' }) } } },
    ] });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component = TestBed.createComponent(PlayerLobbyComponent).componentInstance;
  });

  it('waits for confirmation and prevents a second start while pending', async () => {
    let confirm!: () => void;
    game.startGame.mockImplementation(() => new Promise<void>(resolve => confirm = resolve));
    const pending = component.startGame();
    await component.startGame();
    expect(navigate).not.toHaveBeenCalled();
    expect(game.startGame).toHaveBeenCalledOnce();
    confirm();
    await pending;
    expect(navigate).toHaveBeenCalledWith(['/host', 8]);
  });

  it('stays in the lobby when the server rejects starting', async () => {
    game.startGame.mockRejectedValue(new Error('No playable rounds'));
    await component.startGame();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('No playable rounds');
  });
});
