import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IInstitution, ISector } from './interfaces/institution';
import * as d3 from 'd3';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  dimensionOptions = this.http
    .get<Metric[]>('assets/options.json')
    .pipe(shareReplay(1));

  constructor(private http: HttpClient) {}

  async loadData(): Promise<IData> {
    const data = await this.http
      .get<ISector>(`${environment.api}institutions`)
      .toPromise();
    return { csvData: this.parseJSON2CSV(data), jsonData: data };
  }

  private parseJSON2CSV(data: any) {
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
