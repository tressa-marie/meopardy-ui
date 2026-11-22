import { Injectable } from '@angular/core';
import { Player } from '../../models/player';

@Injectable({
  providedIn: 'root',
})
export class PlayerSessionService {
  private readonly storageKey = 'meopardy-player';

  constructor() {
    if (this.hasStorage()) {
      localStorage.removeItem('meopardy-selected-clue');
      localStorage.removeItem('meopardy-selected-clue-shown-at');
    }
  }

  savePlayer(player: Player): void {
    if (!this.hasStorage()) {
      return;
    }

    const { id, name, gameId, score, joinedAt, sessionToken } = player;
    localStorage.setItem(this.storageKey, JSON.stringify({ id, name, gameId, score, joinedAt, sessionToken }));
    // Discard legacy cached clues, which included answer keys and client timestamps.
    localStorage.removeItem('meopardy-selected-clue');
    localStorage.removeItem('meopardy-selected-clue-shown-at');
  }

  getPlayer(): Player | undefined {
    if (!this.hasStorage()) {
      return undefined;
    }

    const rawPlayer = localStorage.getItem(this.storageKey);

    if (!rawPlayer) {
      return undefined;
    }

    try {
      const player = JSON.parse(rawPlayer) as Player;
      if (!player || !Number.isSafeInteger(player.id) || !Number.isSafeInteger(player.gameId)
        || typeof player.sessionToken !== 'string' || !/^[a-f0-9]{64}$/.test(player.sessionToken)) {
        localStorage.removeItem(this.storageKey);
        return undefined;
      }
      return player;
    } catch {
      localStorage.removeItem(this.storageKey);
      return undefined;
    }
  }

  getGameId(): number | undefined {
    return this.getPlayer()?.gameId;
  }

  updatePlayer(player: Player): void {
    const current = this.getPlayer();
    if (current?.id === player.id && current.gameId === player.gameId) {
      this.savePlayer({ ...current, ...player, sessionToken: current.sessionToken });
    }
  }

  getPlayerId(): number | undefined {
    return this.getPlayer()?.id;
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
