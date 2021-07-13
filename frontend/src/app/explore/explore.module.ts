import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TreeComponent } from './tree/tree.component';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ExploreComponent } from './explore.component';
import {MatButtonModule} from '@angular/material/button';
import { ItemComponent } from './item/item.component';

@NgModule({
  declarations: [TreeComponent, ExploreComponent, ItemComponent],
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
  ],
})
export class ExploreModule {}
