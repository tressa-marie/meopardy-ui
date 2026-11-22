import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { JoinGameComponent } from './join-game.component';
import { GameService } from '../../services/game-api';
import { SocketService } from '../../../core/services/socket/socker.service';
import { gameStub, makeState } from '../../../testing/game-fixtures';

describe('Join-code start screen', () => {
  it('renders the code and waits for a saved start before navigating', async () => {
    const game = gameStub(makeState({ status: 'setup' }));
    let confirm!: () => void;
    game.startGame.mockImplementation(() => new Promise<void>(resolve => confirm = resolve));
    TestBed.configureTestingModule({ imports: [JoinGameComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: GameService, useValue: { getJoinCode: () => of('ABC123') } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ gameId: '8' }) } } },
    ] });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(JoinGameComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ABC123');
    const pending = fixture.componentInstance.startGame();
    expect(navigate).not.toHaveBeenCalled();
    confirm();
    await pending;
    expect(game.startGame).toHaveBeenCalledWith(8);
    expect(navigate).toHaveBeenCalledWith(['/host', 8]);
  });
});
