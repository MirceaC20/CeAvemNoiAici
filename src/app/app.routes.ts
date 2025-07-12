import { Routes } from '@angular/router';
import { ScoreboardComponent } from './scoreboard/scoreboard.component';
import { GameComponent } from './game/game';
import { ManagerComponent } from './manager/manager.component';

export const routes: Routes = [
  { path: '', component: GameComponent },
  { path: 'manager', component: ManagerComponent },
  { path: 'scoreboard', component: ScoreboardComponent },
];
