import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { JoinGameComponent } from './join-game.component';
import { GameService } from '../../services/game-api';
import { SocketService } from '../../../core/services/socket/socker.service';
import { gameStub, makeState } from '../../../testing/game-fixtures';

describe('Join-code screen', () => {
  let game: ReturnType<typeof gameStub>;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    game = gameStub(makeState({ status: 'setup' }));
    TestBed.configureTestingModule({ imports: [JoinGameComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: GameService, useValue: { getJoinCode: () => of('ABC123') } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ gameId: '8' }) } } },
    ] });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('renders the code without a Start Game button and stays put during setup', () => {
    const fixture = TestBed.createComponent(JoinGameComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ABC123');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(game.startGame).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the QR code beside the join-code card and keeps its destination at /join', () => {
    const fixture = TestBed.createComponent(JoinGameComponent);
    fixture.detectChanges();
    const qr: HTMLElement = fixture.nativeElement.querySelector('.join-qr');
    const card: HTMLElement = fixture.nativeElement.querySelector('.join-card');
    expect(qr.nextElementSibling?.classList).toContain('join-content');
    expect(card.contains(qr)).toBe(false);
    expect(qr.querySelector('a')?.getAttribute('href')).toBe('https://jattam.onrender.com/join');
    expect(qr.querySelector('img')?.getAttribute('src')).toBe('images/join-qr.svg');
    expect(card.textContent).toContain('ABC123');
  });

  it('opens the host board when the admin starts the game on another screen', () => {
    const fixture = TestBed.createComponent(JoinGameComponent);
    fixture.detectChanges();
    game.state.set(makeState({ status: 'board' }));
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/host', 8], { replaceUrl: true });
    expect(game.startGame).not.toHaveBeenCalled();
  });

  it('opens the host board when recovering an already started game', () => {
    game.state.set(makeState({ status: 'awaiting_reveal' }));
    const fixture = TestBed.createComponent(JoinGameComponent);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/host', 8], { replaceUrl: true });
  });

  it('waits for synchronization before acting on a started snapshot', () => {
    game.synchronized.set(false);
    game.state.set(makeState({ status: 'board' }));
    const fixture = TestBed.createComponent(JoinGameComponent);
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    game.synchronized.set(true);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/host', 8], { replaceUrl: true });
  });

  it('ignores a started snapshot belonging to a different game', () => {
    game.state.set(makeState({ id: 9, status: 'board' }));
    const fixture = TestBed.createComponent(JoinGameComponent);
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
  });
});
