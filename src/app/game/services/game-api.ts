import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, timeout } from 'rxjs';
import { QuizImport, QuizImportResponse, UnexpectedQuizImportResponseError } from '../models/quiz-import';
import { isRecord } from './quiz-file';
import { environment } from '../../../environments/environment';
import { GameBoard } from '../../models/board';
import { Clue } from '../../models/clue';
import { Game } from '../../models/game';

export const QUIZ_IMPORT_TIMEOUT_MS = 120_000;


@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  importQuiz(quiz: QuizImport): Observable<QuizImportResponse> {
    return this.http.post<unknown>(`${this.apiUrl}/games/import`, quiz, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe(
      timeout(QUIZ_IMPORT_TIMEOUT_MS),
      map(response => {
        if (!isRecord(response) || !Number.isSafeInteger(response['gameId']) || Number(response['gameId']) <= 0
          || typeof response['joinCode'] !== 'string' || !response['joinCode'].trim()
          || typeof response['message'] !== 'string' || !response['message'].trim()) {
          throw new UnexpectedQuizImportResponseError();
        }
        return response as unknown as QuizImportResponse;
      })
    );
  }

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
