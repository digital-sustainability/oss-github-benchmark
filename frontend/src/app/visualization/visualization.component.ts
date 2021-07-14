import { Component, OnInit } from '@angular/core';
import { IData, DataService } from '../data.service';

@Component({
  selector: 'app-visualization',
  templateUrl: './visualization.component.html',
  styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements OnInit {
  data: IData;
  options;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.loadData().then((data) => {
      this.data = data;
    });
  }

  changeOptions(options): void {
    this.options = options;
  }
}
