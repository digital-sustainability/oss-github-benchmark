import { Component, OnInit } from '@angular/core';
import {IData, DataService} from '../data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  data: IData;
  options = {
    dimension1: {
      key: 'total_num_contributors',
      friendly_name: 'Anzahl von Contributors',
      descriptions: 'Anzahl von Contributors'
    },
    dimension2: {
      key: 'num_repos',
      friendly_name: 'Anzahl von Repositories',
      descriptions: 'This is the number of repository for the selectb'
    },
    dimension3: {
      key: 'num_members',
      friendly_name: 'Anzahl Members',
      descriptions: 'Liste aller User welche Member der Github Organisation sind'
    }
  };

  constructor(
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.dataService.loadData().then( data => this.data = data);
  }

}
