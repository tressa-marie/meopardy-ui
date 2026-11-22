import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { JoinGameComponent } from './join-game.component';
import { GameService } from '../../services/game-api';
import { SocketService } from '../../../core/services/socket/socker.service';
import { gameStub, makeState } from '../../../testing/game-fixtures';

describe('Join-code screen', () => {
  it('renders the code without a Start Game button', () => {
    const game = gameStub(makeState({ status: 'setup' }));
    TestBed.configureTestingModule({ imports: [JoinGameComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: GameService, useValue: { getJoinCode: () => of('ABC123') } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ gameId: '8' }) } } },
    ] });
    const fixture = TestBed.createComponent(JoinGameComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ABC123');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(game.startGame).not.toHaveBeenCalled();
  });
});
