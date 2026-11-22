import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Player } from "../../models/player";

export interface OverrideAnswerResult {
    answerId: number;
    playerId: number;
    isCorrect: boolean;
    pointsAwarded: number;
    newScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
    private readonly apiUrl = environment.apiUrl;
    private readonly http = inject(HttpClient);

    joinGame(joinCode: string, playerName: string): Observable<Player> {
        return this.http.post<Player>(`${this.apiUrl}/players/join`, { joinCode, playerName });
    }

    getPlayers(gameId: number): Observable<Player[]> {
        const params = new HttpParams().set('_ts', Date.now().toString());
        return this.http.get<Player[]>(`${this.apiUrl}/players/game/${gameId}`, { params });
    }

    overrideAnswer(answerId: number, isCorrect: boolean): Observable<OverrideAnswerResult> {
        return this.http.patch<OverrideAnswerResult>(`${this.apiUrl}/answers/${answerId}/override`, { isCorrect });
    }
}
