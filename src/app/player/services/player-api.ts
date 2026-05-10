import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/enironment";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
    private readonly apiUrl = environment.apiUrl;
    private readonly http = inject(HttpClient);

    joinGame(joinCode: string, playerName: string) {
        return this.http.post(`${this.apiUrl}/players/join`, { joinCode, playerName });
    }

    getPlayers(gameId: number) {
        return this.http.get(`${this.apiUrl}/players/game/${gameId}`);
    }
}
