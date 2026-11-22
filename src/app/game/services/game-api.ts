import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GameBoard } from '../../models/board';
import { Clue } from '../../models/clue';
import { Game } from '../../models/game';


@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getGame(gameId: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/games/${gameId}`);
  }

  getJoinCode(gameId: number): Observable<string> {
    return this.http.get<string | { joinCode: string }>(`${this.apiUrl}/games/${gameId}/join`).pipe(
      map(response => typeof response === 'string' ? response : response.joinCode)
    );
  }

  getGameBoard(gameId: number): Observable<GameBoard> {
    return this.http.get<GameBoard>(`${this.apiUrl}/games/${gameId}/board`);
  }

  getClue(clueId: number): Observable<Clue> {
    return this.http.get<Clue>(`${this.apiUrl}/clues/${clueId}`);
  }

  markClueAnswered(clueId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/clues/${clueId}/answered`, {});
  }
}
