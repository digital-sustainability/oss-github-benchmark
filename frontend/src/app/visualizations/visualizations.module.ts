import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BubbleComponent } from './bubble/bubble.component';
import { VisualizationsComponent } from './visualizations.component';
import {MatCardModule} from '@angular/material/card';
import { SunburstComponent } from './sunburst/sunburst.component';
import { LineComponent } from './line/line.component';



@NgModule({
  declarations: [BubbleComponent, VisualizationsComponent, SunburstComponent, LineComponent],
  imports: [
    CommonModule,
    MatCardModule
  ],
  exports: [
    BubbleComponent,
    VisualizationsComponent,
  ],
})
export class VisualizationsModule { }
