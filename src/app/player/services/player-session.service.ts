import { Injectable } from '@angular/core';
import { Player } from '../../models/player';

@Injectable({
  providedIn: 'root',
})
export class PlayerSessionService {
  private readonly storageKey = 'meopardy-player';

  savePlayer(player: Player): void {
    localStorage.setItem(this.storageKey, JSON.stringify(player));
  }

  getPlayer(): Player | undefined {
    const rawPlayer = localStorage.getItem(this.storageKey);

    if (!rawPlayer) {
      return undefined;
    }

    try {
      return JSON.parse(rawPlayer) as Player;
    } catch {
      localStorage.removeItem(this.storageKey);
      return undefined;
    }
  }

  getPlayerId(): number | undefined {
    return this.getPlayer()?.id;
  }
}
