import { Component, OnInit, Input } from '@angular/core';
import { IData, Metric } from '../data.service';

@Component({
  selector: 'app-visualizations',
  templateUrl: './visualizations.component.html',
  styleUrls: ['./visualizations.component.scss'],
})
export class VisualizationsComponent implements OnInit {
  @Input() data: IData;
  @Input() options: {
    dimension1: Metric;
    dimension2: Metric;
    dimension3: Metric;
  };

  constructor() {}

  ngOnInit(): void {}
}
