import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ListComponent} from './metric/list/list.component';
import {RankingComponent} from './ranking/ranking.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'metrics',
    component: ListComponent
  },
  {
    path: 'ranking',
    component: RankingComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
