import { Component, OnInit } from '@angular/core';
import {IData, DataService} from '../data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  data: IData;
  options;

  constructor(
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.dataService.loadData().then( data => this.data = data);
  }

  changeOptions(options): void {
    this.options = options;
  }

}
