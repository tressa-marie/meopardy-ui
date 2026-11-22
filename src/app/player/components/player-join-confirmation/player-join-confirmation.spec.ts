import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PlayerJoinConfirmationComponent } from './player-join-confirmation';
import { SocketService } from '../../../core/services/socket/socker.service';
import { PlayerSessionService } from '../../services/player-session.service';
import { clue, gameStub, makeState, player } from '../../../testing/game-fixtures';

describe('Player phase recovery', () => {
  const game = gameStub(makeState({ status: 'setup' }));
  beforeEach(() => {
    game.state.set(makeState({ status: 'setup' }));
    game.synchronized.set(true);
    TestBed.configureTestingModule({ imports: [PlayerJoinConfirmationComponent], providers: [
      provideRouter([]),
      { provide: SocketService, useValue: game },
      { provide: PlayerSessionService, useValue: { getGameId: () => player.gameId } },
    ] });
  });

  it('joins the saved game and recovers a clue missed while disconnected', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PlayerJoinConfirmationComponent);
    fixture.detectChanges();
    expect(game.joinPlayerGame).toHaveBeenCalledWith(8);
    game.state.set(makeState({ status: 'answering', activeClue: clue }));
    fixture.detectChanges();
    expect(navigate).toHaveBeenLastCalledWith(['/player-answer'], { replaceUrl: true });
  });

  it('does not navigate based on stale state before rejoining', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    game.synchronized.set(false);
    game.state.set(makeState({ status: 'answering', activeClue: clue }));
    const fixture = TestBed.createComponent(PlayerJoinConfirmationComponent);
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
  });
});
