import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InstitutionDetailViewComponent } from './institution-detail-view/institution-detail-view.component';
import { RankingComponent } from './ranking/ranking.component';
import { RepositoriesRankingComponent } from './repositories-ranking/repositories-ranking.component';
import { RepositoryDetailViewComponent } from './repository-detail-view/repository-detail-view.component';
import { UserRankingComponent } from './user-ranking/user-ranking.component';
import { AddInstitutionComponent } from './add-institution/add-institution.component';
import { AuthenticationGuard } from './authentication-guard.guard';
import { LoginComponent } from './login/login.component';
import { LoginModule } from './login/login.module';
import { LoginRoutingModule } from './login/login-routing.module';

const routes: Routes = [
  // {
  //   path: 'explore',
  //   component: ExploreComponent,
  // },
  // {
  //   path: 'visualization',
  //   component: VisualizationComponent,
  // },
  // {
  //   path: 'visualization/:institution',
  //   component: VisualizationComponent,
  // },
  // {
  //   path: 'metrics',
  //   component: ListComponent,
  // },
  {
    path: 'institutions',
    component: RankingComponent,
  },
  {
    path: 'institutions/:institution',
    component: RankingComponent,
  },
  {
    path: 'repositories',
    component: RepositoriesRankingComponent,
  },
  {
    path: 'repositories/:institution/:repository',
    component: RepositoriesRankingComponent,
  },
  {
    path: 'people',
    component: UserRankingComponent,
  },
  {
    path: 'add-institution',
    component: AddInstitutionComponent,
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'add-institution/:add-institution',
    component: AddInstitutionComponent,
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  // {
  //   path: 'explore/item/:itemName',
  //   component: ExploreItemComponent,
  // },
  { path: '', redirectTo: '/institutions', pathMatch: 'full' },
  { path: "**", redirectTo: '/institutions', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledNonBlocking',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
