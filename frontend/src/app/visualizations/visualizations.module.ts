import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BubbleComponent } from './bubble/bubble.component';
import { VisualizationsComponent } from './visualizations.component';



@NgModule({
  declarations: [BubbleComponent, VisualizationsComponent],
  imports: [
    CommonModule
  ],
  exports: [
    BubbleComponent,
    VisualizationsComponent
  ]
})
export class VisualizationsModule { }
