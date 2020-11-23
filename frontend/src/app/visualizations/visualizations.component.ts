import { Component, OnInit, Input } from '@angular/core';
import {IData} from '../data.service';

@Component({
  selector: 'app-visualizations',
  templateUrl: './visualizations.component.html',
  styleUrls: ['./visualizations.component.scss']
})
export class VisualizationsComponent implements OnInit {
  @Input() data: IData;
  @Input() options;

  constructor(
  ) { }

  ngOnInit(): void {
  }

}
