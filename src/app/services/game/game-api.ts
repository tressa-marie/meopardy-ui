import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enironment';
import { GameBoard } from '../../models/board';
import { Clue } from '../../models/clue';
import { Game } from '../../models/game';


@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getGame(gameId: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/games/${gameId}`);
  }

  getJoinCode(gameId: number): Observable<{ joinCode: string }> {
    return this.http.get<{ joinCode: string }>(`${this.apiUrl}/games/${gameId}/join`);
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
