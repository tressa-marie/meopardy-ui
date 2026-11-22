import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { bindPlayerGame } from '../../services/player-game';
import { PlayerSessionService } from '../../services/player-session.service';

@Component({
  selector: 'app-player-board', standalone: true, imports: [RouterLink, DecimalPipe],
  templateUrl: './player-board.html', styleUrl: './player-board.scss',
})
export class PlayerBoardComponent {
  private readonly session = inject(PlayerSessionService);
  private readonly playerId = this.session.getPlayerId();
  private readonly gameId = this.session.getGameId();
  readonly game = bindPlayerGame();
  readonly playerStanding = computed(() => {
    const state = this.game.state();
    if (!this.game.synchronized() || !state || state.id !== this.gameId) return null;
    const standing = state.standings.find(player => player.id === this.playerId);
    if (!standing) return null;
    return {
      ...standing,
      tied: state.standings.some(player => player.id !== this.playerId && player.rank === standing.rank),
      totalPlayers: state.standings.length,
    };
  });
}
