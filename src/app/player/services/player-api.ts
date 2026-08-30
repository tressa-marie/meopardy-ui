import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Player } from "../../models/player";

export interface SubmitAnswerRequest {
    clueId: number;
    playerId: number;
    submittedAnswer: string;
    responseTimeMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
    private readonly apiUrl = environment.apiUrl;
    private readonly http = inject(HttpClient);

    joinGame(joinCode: string, playerName: string): Observable<Player> {
        console.log('[PlayerService] POST /players/join', { joinCode, playerName });
        return this.http.post<Player>(`${this.apiUrl}/players/join`, { joinCode, playerName });
    }

    getPlayers(gameId: number): Observable<Player[]> {
        const params = new HttpParams().set('_ts', Date.now().toString());
        console.log('[PlayerService] GET /players/game/:id', { gameId, params: params.toString() });
        return this.http.get<Player[]>(`${this.apiUrl}/players/game/${gameId}`, { params });
    }

    submitAnswer(request: SubmitAnswerRequest): Observable<void> {
        console.log('[PlayerService] POST /answers/submit', request);
        return this.http.post<void>(`${this.apiUrl}/answers/submit`, request);
    }
}
