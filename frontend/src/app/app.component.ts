import { Component, OnInit } from '@angular/core';
import { DataService } from './data.service';
import { IData } from './visualizations/visualizations.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'oss-github-benchmark';

  constructor() {}

  ngOnInit(): void {}
}
