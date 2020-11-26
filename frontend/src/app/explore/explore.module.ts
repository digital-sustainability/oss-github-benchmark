import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExploreRoutingModule } from './explore-routing.module';
import { TreeComponent } from './tree/tree.component';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ExploreComponent } from './explore.component';
import {MatButtonModule} from '@angular/material/button';

@NgModule({
  declarations: [TreeComponent, ExploreComponent],
  imports: [
    CommonModule,
    ExploreRoutingModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
  ],
})
export class ExploreModule {}
