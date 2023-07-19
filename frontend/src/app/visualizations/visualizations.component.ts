import { Component, OnInit, Input } from '@angular/core';
import { Metric } from '../data.service';
import { InstitutionSumary } from '../types';

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

export interface IData {
  jsonData: Sector;
  csvData: any[];
}
export type Sector = {
  [sector: string]: InstitutionSumary[];
};
