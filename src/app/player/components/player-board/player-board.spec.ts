import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PlayerBoardComponent } from './player-board';
import { SocketService } from '../../../core/services/socket/socker.service';
import { PlayerSessionService } from '../../services/player-session.service';
import { gameStub, makeState, player } from '../../../testing/game-fixtures';

describe('Player board personal standing', () => {
  let game: ReturnType<typeof gameStub>;
  let fixture: ComponentFixture<PlayerBoardComponent>;
  const otherPlayer = { ...player, id: 3, name: 'Other contestant', score: 9000, rank: 1 };

  beforeEach(() => {
    game = gameStub(makeState({ standings: [otherPlayer, { ...player, score: 1200, rank: 2 }] }));
    TestBed.configureTestingModule({ imports: [PlayerBoardComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: PlayerSessionService, useValue: { getGameId: () => 8, getPlayerId: () => player.id } },
    ] });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(PlayerBoardComponent);
    fixture.detectChanges();
  });

  it('shows only the session player score and rank, even when another player ranks first', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ada');
    expect(text).toContain('1,200');
    expect(text).toContain('#2');
    expect(text).toContain('of 2');
    expect(text).not.toContain('Other contestant');
    expect(text).not.toContain('9,000');
  });

  it('updates the score and shows ties from new server standings', () => {
    game.state.set(makeState({ standings: [
      { ...player, score: 9000, rank: 1 }, otherPlayer,
    ] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.score-value').textContent).toContain('9,000');
    expect(fixture.nativeElement.querySelector('.rank-value').textContent).toContain('Tied #1');
  });

  it('shows only the current player final standing when the game finishes', () => {
    game.state.update(state => ({ ...state!, status: 'finished' }));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Your final score');
    expect(text).toContain('1,200');
    expect(text).not.toContain('Other contestant');
    expect(fixture.nativeElement.querySelector('[aria-label="Final scores"]')).toBeNull();
  });

  it('does not substitute another player when the session player is absent', () => {
    game.state.set(makeState({ standings: [otherPlayer] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading your score');
    expect(fixture.nativeElement.querySelector('.player-score-card')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Other contestant');
  });

  it('waits for a synchronized snapshot from the correct game', () => {
    game.synchronized.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.player-score-card')).toBeNull();
    game.synchronized.set(true);
    game.state.update(state => ({ ...state!, id: 9 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.player-score-card')).toBeNull();
  });
});
