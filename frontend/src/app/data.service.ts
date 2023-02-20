import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IInstitution, ISector } from './interfaces/institution';
import * as d3 from 'd3';
import { shareReplay, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  dimensionOptions = this.http
    .get<Metric[]>('assets/options.json')
    .pipe(shareReplay(1));

  constructor(private http: HttpClient) {}
  private institutionData = null;

  async loadInstitutionData(config: {
    search?: string;
    sort?: string;
    direction?: 'ASC' | 'DESC';
    page?: string;
    count?: string;
    includeForks?: string;
    sector?: string[];
    sendStats?: string;
    findName?: string;
  }): Promise<any> {

    this.http.get<any>(`${environment.api}paginatedInstitutions`, {
      params: config,
    }).subscribe((res) => {
      this.institutionData = res;
    })


    /*this.institutionData = await this.http
      .get<any>(`${environment.api}paginatedInstitutions`, {
        params: config,
      })
      .toPromise();*/
      
    if (config.findName)
      return {
        csvData: this.parseJSON2CSV(this.institutionData),
        jsonData: this.institutionData,
      };
    return {
      csvData: this.parseJSON2CSV(this.institutionData.institutions),
      jsonData: this.institutionData.institutions,
      total: this.institutionData.total,
      sectors: this.institutionData.sectors,
    };
  }

  async loadRepoData(config: {
    search?: string;
    sort?: string;
    direction?: 'ASC' | 'DESC';
    page?: string;
    count?: string;
    includeForks?: string;
  }): Promise<any> {
    const repoData = await this.http
      .get<any>(`${environment.api}paginatedRepositories`, {
        params: config,
      })
      .toPromise();
    return {
      csvData: this.parseJSON2CSV(repoData.repositories),
      jsonData: repoData.repositories,
      total: repoData.total,
    };
  }

  async loadUserData(config: {
    search: string;
    sort: string;
    direction: 'ASC' | 'DESC';
    page: string;
    count: string;
  }): Promise<any> {
    const userData = await this.http
      .get<any>(`${environment.api}paginatedUsers`, {
        params: config,
      })
      .toPromise();
    return {
      csvData: this.parseJSON2CSV(userData.users),
      jsonData: userData.users,
      total: userData.total,
    };
  }

  loadDataObservable(): Observable<any> {
    return this.http.get(`${environment.api}institutions`).pipe(
      switchMap((data) => {
        return of({
          csvData: this.parseJSON2CSV(data),
          jsonData: data,
        });
      })
    );
  }

  private parseJSON2CSV(data: any): any {
    return data as d3.DSVRowArray;
  }
}
export interface IData {
  jsonData: ISector;
  csvData: any[];
}

export interface Metric {
  key: string;
  friendly_name: string;
  description: string;
}
