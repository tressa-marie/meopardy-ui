import { Routes } from '@angular/router';
import { GameHomeComponent } from './game/components/game-home/game-home';
import { UploadQuizComponent } from './game/components/upload-quiz/upload-quiz';
import { PlayerLobbyComponent } from './admin/components/player-lobby-component/player-lobby-component';
import { JoinGameComponent } from './game/components/join-game/join-game.component';
import { PlayerJoinComponent } from './player/components/player-join/player-join';
import { PlayerJoinConfirmationComponent } from './player/components/player-join-confirmation/player-join-confirmation';
import { PlayerBoardComponent } from './player/components/player-board/player-board';
import { PlayerAnswerComponent } from './player/components/player-answer/player-answer';
import { GameBoardComponentComponent } from './game/components/game-board-component/game-board-component.component';
import { AdminAnswerDashboardComponent } from './admin/components/admin-answer-dashboard/admin-answer-dashboard';

export const routes: Routes = [
  { path: 'upload-quiz', component: UploadQuizComponent },
  { path: 'admin-lobby/:gameId', component: PlayerLobbyComponent },
  { path: 'admin-dashboard/:gameId', component: AdminAnswerDashboardComponent },
  { path: 'join-code/:gameId', component: JoinGameComponent },
  { path: 'host/:gameId', component: GameBoardComponentComponent },
  { path: 'join', component: PlayerJoinComponent },
  { path: 'join-confirmation', component: PlayerJoinConfirmationComponent },
  { path: 'player-board', component: PlayerBoardComponent },
  { path: 'player-answer', component: PlayerAnswerComponent },
  { path: '', component: GameHomeComponent, pathMatch: 'full' }
];
