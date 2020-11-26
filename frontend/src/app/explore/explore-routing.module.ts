import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {ExploreComponent} from './explore.component';
import {ItemComponent} from './item/item.component';

const routes: Routes = [
  {
    path: 'explore',
    component: ExploreComponent
  },
  {
    path: 'explore/item/:itemName',
    component: ItemComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExploreRoutingModule { }
