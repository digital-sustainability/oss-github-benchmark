import { Component, OnInit } from '@angular/core';
import {DataService, IData} from './data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'oss-github-benchmark';

  constructor(
  ) {
  }

  ngOnInit(): void {
  }
}
