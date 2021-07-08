import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { NavComponent } from './nav/nav.component';

import { HttpClientModule } from '@angular/common/http';
import {VisualizationsModule} from './visualizations/visualizations.module';
import {CommonModule} from '@angular/common';
import { DimensionSelectorComponent } from './dimension-selector/dimension-selector.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListComponent } from './metric/list/list.component';
import { ItemComponent } from './metric/item/item.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatCardModule} from '@angular/material/card';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatTableModule} from '@angular/material/table'
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { RankingComponent } from './ranking/ranking.component';
import {MatSortModule} from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatPaginatorModule} from '@angular/material/paginator';
import {TreeComponent} from "./explore/tree/tree.component";
import {ExploreComponent} from "./explore/explore.component";


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavComponent,
    DimensionSelectorComponent,
    ListComponent,
    ItemComponent,
    RankingComponent,
    TreeComponent,
    ExploreComponent,
    ItemComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CommonModule,
    ReactiveFormsModule,
    VisualizationsModule,
    FormsModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    Ng2SearchPipeModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatPaginatorModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
