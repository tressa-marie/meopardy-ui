import { Routes } from '@angular/router';
import { GameBoardComponentComponent } from './components/game-board-component/game-board-component.component';
import { JoinGameComponent } from './game/components/join-game/join-game.component';
import { PlayerJoinComponent } from './player/components/player-join/player-join';
import { PlayerJoinConfirmationComponent } from './player/components/player-join-confirmation/player-join-confirmation';

export const routes: Routes = [
  { path: 'join-code', component: JoinGameComponent },
  { path: 'host', component: GameBoardComponentComponent },
  { path: 'join', component: PlayerJoinComponent },
  { path: 'join-confirmation', component: PlayerJoinConfirmationComponent },
  { path: '', redirectTo: 'host', pathMatch: 'full' }
];
