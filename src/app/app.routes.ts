import { Routes } from '@angular/router';
import { GameComponent } from './game/game';
import { ManagerComponent } from './manager/manager.component';

export const routes: Routes = [
  { path: '', component: GameComponent },
  { path: 'manager', component: ManagerComponent }
];