import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ListComponent} from './metric/list/list.component';
import {ItemComponent} from './explore/item/item.component';
import {ExploreComponent} from './explore/explore.component';
import {RankingComponent} from './ranking/ranking.component';

const routes: Routes = [
  {
    path: 'explore',
    component: ExploreComponent
  },
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
  },
  {
    path: 'explore/item/:itemName',
    component: ItemComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
