import { effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../../core/services/socket/socker.service';
import { PlayerSessionService } from './player-session.service';

// Every player route reconciles against the same authoritative phase, including on refresh.
export function bindPlayerGame(): SocketService {
  const game = inject(SocketService);
  const session = inject(PlayerSessionService);
  const router = inject(Router);
  const gameId = session.getGameId();
  if (gameId) game.joinPlayerGame(gameId);
  else void router.navigate(['/join']);
  effect(() => {
    const state = game.state();
    if (!game.synchronized() || !state || state.id !== gameId) return;
    const target = state.status === 'setup' ? '/join-confirmation'
      : ['clue_open', 'answering', 'reveal'].includes(state.status) ? '/player-answer' : '/player-board';
    if (router.url.split('?')[0] !== target) void router.navigate([target], { replaceUrl: true });
  });
  return game;
}
