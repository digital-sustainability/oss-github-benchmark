import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IInstitution, ISector } from './interfaces/institution';
import * as d3 from 'd3';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DataService {

  dimensionOptions = this.http.get<Metric[]>('assets/options.json').pipe(shareReplay(1));

  constructor(private http: HttpClient) {
  }

  loadData(): Promise<IData> {
    return Promise.all([
      d3.csv('assets/oss-github-benchmark.csv'),
      this.http
        .get<ISector>('assets/oss-github-benchmark.json')
        .toPromise(),
    ]).then(([csvData, jsonData]) => ({ csvData, jsonData }));
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
