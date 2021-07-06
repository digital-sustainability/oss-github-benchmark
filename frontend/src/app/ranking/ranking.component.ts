import { Component, OnInit, Input } from '@angular/core';
import { DataService, IData } from 'src/app/data.service';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})

export class RankingComponent implements OnInit {
  displayedColumns: string[] = ['name', 'num_members', 'num_repos', 'sector'];
  // displayedColumns: string[] = ['name', 'num_members', 'num_repos', 'sector', 'repo_names']; // <-- Display repo names
  @Input() data: IData;
  organisations = []
  
  constructor(private dataService: DataService) {
  };

  ngOnInit(): void {
    this.dataService.loadData().then( data => {
        this.organisations = data.csvData;
        let i = 0;
        this.organisations.forEach(element => {
          this.organisations[i].repo_names = this.organisations[i].repo_names.slice(1, -1).replace(/\'/g, '');
          console.log(this.organisations[i].repo_names)
          i++;
        });
    });
  }
}