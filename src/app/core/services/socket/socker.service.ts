import { Injectable, NgZone, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Player } from '../../../models/player';
import { environment } from '../../../../environments/enironment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private readonly socket: Socket;
  private readonly ngZone = inject(NgZone);
  private readonly serverUrl = environment.apiUrl.replace(/\/api$/, '');

  constructor() {
    this.socket = io(this.serverUrl);
    this.socket.on('connect', () => {
      console.log('[SocketService] connected', {
        id: this.socket.id,
        serverUrl: this.serverUrl,
      });
    });
    this.socket.on('disconnect', reason => {
      console.log('[SocketService] disconnected', { reason });
    });
  }

  joinGame(gameId: number): void {
    console.log('[SocketService] emit admin:joinGame', { gameId });
    this.socket.emit('admin:joinGame', { gameId });
  }

  notifyPlayerJoined(gameId: number): void {
    console.log('[SocketService] emit player:joined', { gameId });
    this.socket.emit('player:joined', { gameId });
  }

  onPlayersUpdated(callback: (players?: Player[]) => void): void {
    this.socket.off('players:updated');
    this.socket.on('players:updated', (players: Player[]) => {
      console.log('[SocketService] received players:updated', { players });
      this.ngZone.run(() => callback(players));
    });
  }

  offPlayersUpdated(): void {
    this.socket.off('players:updated');
  }
}
