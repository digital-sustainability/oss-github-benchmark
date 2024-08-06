import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InstitutionDetailViewComponent } from './institution-detail-view/institution-detail-view.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { RankingComponent as InstitutionRankingComponent } from './ranking/ranking.component';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTreeModule } from '@angular/material/tree';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
// import { NgChartsModule } from 'ng2-charts';
import { ToNiceNamePipe } from './pipes/toNiceName.pipe';
import { RepositoriesRankingComponent } from './repositories-ranking/repositories-ranking.component';
import { RepositoryDetailViewComponent } from './repository-detail-view/repository-detail-view.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { UserRankingComponent } from './user-ranking/user-ranking.component';
import { AddInstitutionComponent } from './add-institution/add-institution.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { NgxLoadingButtonsModule } from 'ngx-loading-buttons';
@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    ToNiceNamePipe,
    InstitutionRankingComponent,
    InstitutionDetailViewComponent,
    RepositoriesRankingComponent,
    RepositoryDetailViewComponent,
    UserRankingComponent,
    AddInstitutionComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
    ToastrModule.forRoot({timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,}),
    AppRoutingModule,
    HttpClientModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatTreeModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatTooltipModule,
    MatExpansionModule,
    MatDividerModule,
    // NgChartsModule,
    DatePipe,
    NgxLoadingButtonsModule,
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}

