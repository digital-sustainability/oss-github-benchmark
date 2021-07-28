import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VisualizationComponent } from './visualization/visualization.component';
import { ListComponent } from './metric/list/list.component';
import { ExploreItemComponent } from './explore/explore-item/explore-item.component';
import { ExploreComponent } from './explore/explore.component';
import { RankingComponent } from './ranking/ranking.component';
import { RepositoriesRankingComponent } from './repositories-ranking/repositories-ranking.component';

const routes: Routes = [
  {
    path: 'explore',
    component: ExploreComponent,
  },
  {
    path: 'visualization',
    component: VisualizationComponent,
  },
  {
    path: 'visualization/:institution',
    component: RankingComponent,
  },
  {
    path: 'metrics',
    component: ListComponent,
  },
  {
    path: 'ranking',
    component: RankingComponent,
  },
  {
    path: 'ranking/:institution',
    component: RankingComponent,
  },
  {
    path: 'repositories-ranking',
    component: RepositoriesRankingComponent,
  },
  {
    path: 'explore/item/:itemName',
    component: ExploreItemComponent,
  },
  { path: '', redirectTo: '/ranking', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
