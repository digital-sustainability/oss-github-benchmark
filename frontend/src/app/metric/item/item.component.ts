import { Component, Input, OnInit } from '@angular/core';
import {Metric} from 'src/app/data.service';

@Component({
  selector: 'app-metric-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {

  @Input() metric: Metric;

  constructor() { }

  ngOnInit(): void {
  }

}
