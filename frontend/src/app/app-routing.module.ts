import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {ExploreComponent} from './explore/explore.component';
import {HomeComponent} from './home/home.component';
import {ListComponent} from './metric/list/list.component';

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
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
