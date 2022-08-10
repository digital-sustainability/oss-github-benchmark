import { Component, OnInit } from '@angular/core';
import { DataService, IData } from '../data.service';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {
  data: IData;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.loadInstitutionData({}).then((data) => (this.data = data));
  }
}
