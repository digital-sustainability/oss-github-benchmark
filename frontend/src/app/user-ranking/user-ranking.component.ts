import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService, IData } from 'src/app/data.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { IInstitution } from 'src/app/interfaces/institution';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-ranking',
  templateUrl: './user-ranking.component.html',
  styleUrls: ['./user-ranking.component.scss'],
})
export class UserRankingComponent implements OnInit {
  item: IInstitution;
  displayedColumns: any[] = [
    ['avatar_url', '', false, 'img'],
    ['name', 'Name', false, 'string'],
    ['login', 'Github user', false, 'string'],
    ['company', 'Company', false, 'string'],
    ['location', 'Location', false, 'string'],
    ['twitter_username', 'Twitter', false, 'string'],
    ['contributions', 'Contributions', false, 'number'],
    ['public_repos', 'Public repos', false, 'number'],
    ['public_gists', 'Public gists', false, 'number'],
    ['followers', 'Followers', false, 'number'],
    ['created_at', 'Created at', false, 'date'],
    ['updated_at', 'Updated at ', false, 'date'],
  ];
  displayedColumnsOnlyNames = this.displayedColumns.map((column) => column[0]);
  recordFilter = '';
  @Input() data: IData;
  dataSource: any = new MatTableDataSource();
  numUsers: number;
  state: Date;
  users: any[] = [];
  includeForks: boolean = false;

  doFilter = (value: string) => {
    if (value) {
      this.recordFilter = value.trim().toLocaleLowerCase();
    }
    setTimeout(this.triggerFilter, 100);
  };

  triggerFilter = () => {
    this.dataSource.filter = 'trigger filter';
    this.numUsers = this.dataSource.filteredData.length;
  };

  goToLink(url: string) {
    window.open(url, '_blank');
  }

  constructor(
    private dataService: DataService,
    private location: Location,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.dataService.loadUserData().then((userData) => {
      this.users = Object.entries(userData.jsonData)
        .reduce((previousValue, currentValue) => {
          const [key, value] = currentValue;
          return previousValue.concat(value);
        }, [])
        .map((u) => {
          if (!u.name) {
            u.name = u.login;
          }
          let contributions_sum = Object.values(u.contributions).reduce(
            (a, b) => {
              a +
                Object.values(b).reduce((c, d) => {
                  c +
                    Object.values(d).reduce((e: number, f: number) => {
                      e + f;
                    }, 0);
                }, 0);
            },
            0
          );
          u.contributions = {
            tree: u.contributions,
            sum: contributions_sum,
          };
          return u;
        });
      console.log(this.users);
      this.dataSource = new MatTableDataSource(this.users);
      this.numUsers = this.users.length;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      setTimeout(this.triggerFilter, 100);

      this.dataSource.filterPredicate = (data: any, filter: string) => {
        let datastring: string = '';
        let property: string;
        let filterNew = this.recordFilter;
        for (property in data) {
          datastring += data[property];
        }
        datastring = datastring.replace(/\s/g, '').toLowerCase();
        filterNew = filterNew.replace(/\s/g, '').toLowerCase();
        return datastring.includes(filterNew);
      };
    });
  }

  changeURL(relativeUrl: string): void {
    this.location.replaceState(relativeUrl);
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
}
