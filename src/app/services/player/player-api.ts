import { Injectable } from "@angular/core";
import { environment } from "../../../environments/enironment";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
    private readonly apiUrl = environment.apiUrl;
    constructor(private http: HttpClient) {}

    joinGame(joinCode: string, playerName: string) {
        console.log('api', `${this.apiUrl}/players/join`, { joinCode, playerName });
        return this.http.post(`${this.apiUrl}/players/join`, { joinCode, playerName });
    }
}