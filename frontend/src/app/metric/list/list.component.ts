import { Component, OnInit } from '@angular/core';
import {DataService, Metric} from 'src/app/data.service';

@Component({
  selector: 'app-metric-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  metrics: Metric[] = [];

  constructor(
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.dataService.dimensionOptions.subscribe( ops => this.metrics = ops);
  }

}
