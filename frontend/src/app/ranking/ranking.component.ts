import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { DataService, IData } from 'src/app/data.service';
import {MatSort, Sort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {MatPaginator} from '@angular/material/paginator';

const sortState: Sort = {active: 'num_repos', direction: 'desc'};

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})

export class RankingComponent implements OnInit {
  displayedColumns: string[] = ['name', 'num_members', 'num_repos', 'sector', 'repo_names'];
  @Input() data: IData;
  organisations = [];
  reposToDisplay = 6;
  dataSource = new MatTableDataSource();

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }
  
  constructor(
    private dataService: DataService,
    private router: Router
  ) {
    this.sort = new MatSort;
  };

  ngOnInit(): void {
    this.dataService.loadData().then( data => {
        this.organisations = data.csvData;
        let i = 0;
        this.organisations.forEach(element => {
          this.organisations[i].repo_names = JSON.parse(this.organisations[i].repo_names.replace(/\'/g, "\""));
          let len = element.repo_names.length;
          this.organisations[i].repo_names = element.repo_names.slice(0, this.reposToDisplay).join(", ");
          if (len >= this.reposToDisplay) {
            this.organisations[i].repo_names += "..."
          }
          i++;
        });
        this.dataSource = new MatTableDataSource(this.organisations);
        this.dataSource.sort = this.sort;

        this.sort.active = sortState.active;
        this.sort.direction = sortState.direction;
        this.sort.sortChange.emit(sortState);
        this.dataSource.paginator = this.paginator;
    });
  }

  navigateTo(name: string): void {
    this.router.navigate(['explore', 'item', name]);
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
}