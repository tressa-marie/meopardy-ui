import { PlayerSessionService } from './player-session.service';
import { player } from '../../testing/game-fixtures';

describe('Player session persistence', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('stores identity and recovery token without caching the full game or answer keys', () => {
    const session = new PlayerSessionService();
    localStorage.setItem('meopardy-selected-clue', '{"correctAnswer":"secret"}');
    session.savePlayer({ ...player, state: { correctAnswer: 'secret' } } as typeof player);
    expect(localStorage.getItem('meopardy-player')).not.toContain('secret');
    expect(localStorage.getItem('meopardy-selected-clue')).toBeNull();
    session.updatePlayer({ ...player, score: 200, sessionToken: undefined });
    expect(session.getPlayer()?.sessionToken).toBe(player.sessionToken);
    expect(session.getPlayer()?.score).toBe(200);
  });

  it('rejects old sessions without a recovery token instead of trusting a player ID', () => {
    localStorage.setItem('meopardy-player', JSON.stringify({ ...player, sessionToken: undefined }));
    expect(new PlayerSessionService().getPlayer()).toBeUndefined();
    expect(localStorage.getItem('meopardy-player')).toBeNull();
  });
});
