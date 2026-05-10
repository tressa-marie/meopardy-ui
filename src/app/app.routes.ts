import { Routes } from '@angular/router';
import { HostGameComponent } from './components/host-game/host-game.component';
import { JoinGameComponent } from './components/join-game/join-game.component';
import { PlayerJoinComponent } from './components/player-join/player-join';
import { PlayerJoinConfirmationComponent } from './components/player-join-confirmation/player-join-confirmation';

export const routes: Routes = [
  { path: 'join-code', component: JoinGameComponent },
  { path: 'host', component: HostGameComponent },
  { path: 'join', component: PlayerJoinComponent },
  { path: 'join-confirmation', component: PlayerJoinConfirmationComponent },
  { path: '', redirectTo: 'host', pathMatch: 'full' }
];
