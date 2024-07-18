import { TodoInstitution } from './types';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Institution,
  InstitutionSumary as InstitutionSummary,
  Repository,
  User,
  Organization,
} from './types';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { TokenService } from './services/token.service';
import { ToastrService } from 'ngx-toastr';
import { catchError } from 'rxjs/operators';
import { NEVER, throwError } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class DataService {
  dimensionOptions = this.http
    .get<Metric[]>('assets/options.json')
    .pipe(shareReplay(1));

  constructor(private http: HttpClient, private tokenService: TokenService, private toastr: ToastrService) {}
  private institutionData = null;
  private TodoInstitutions = null;

  async createNewTodoInstitution(institution) {
    if (!institution ) {
      throw new Error('Invalid institution object');
    }
    const token = this.tokenService.getAccessToken(); 
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return await this.http
      .post<TodoInstitution>(`${environment.api}api/institution`, {institution}, { headers })
      .toPromise();
  }

  async DeleteTodoInstitution(institution) {
    if (!institution ) {
      throw new Error('Invalid institution object');
    }
    const token = this.tokenService.getAccessToken(); 
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  const options = {
    headers: headers,
    body: { institution }
  };
  return await this.http
    .delete<TodoInstitution>(`${environment.api}api/institution`, options)
    .toPromise();

  }

  async LoadTodoInstitutions() {
    return this.http
      .get<TodoInstitution>(`${environment.api}api/institution`)
      .pipe(
        catchError(error => {
          if (error.status === 401) {
            this.toastr.error("Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.", "Login timeout", {disableTimeOut: true});
          }
          return throwError(error);
        })
      )
      .toPromise();
  }

  async loadSingleInstitution(config: { name: string }): Promise<Institution> {
    this.institutionData = await this.http
      .get<Institution>(`${environment.api}api/singleInstitution`, {
        params: config,
      })
      .toPromise();
    return this.institutionData;
  }

  async loadInstitutionSummaries(config: {
    search?: string;
    sort?: string;
    direction?: 'ASC' | 'DESC';
    page?: string;
    count?: string;
    includeForks?: string;
    sector?: string[];
  }): Promise<{
    institutions: InstitutionSummary[];
    total: number;
    sectors: { [key: string]: number };
  }> {
    this.institutionData = await this.http
      .get<InstitutionSummary[]>(`${environment.api}api/paginatedInstitutions`, {
        params: config,
      })
      .toPromise();
    return this.institutionData;
  }

  async loadLatestUpdate() {
    let latestUpdate = await this.http
      .get<{ updatedDate: string }>(`${environment.api}api/latestUpdate`, {})
      .toPromise();
    return latestUpdate.updatedDate;
  }

  async loadRepoData(config: {
    search?: string;
    sort?: string;
    direction?: 'ASC' | 'DESC';
    page?: string;
    count?: string;
    includeForks?: string;
  }) {
    const repoData = await this.http
      .get<{
        repositories: Repository[];
        total: number;
      }>(`${environment.api}api/paginatedRepositories`, {
        params: config,
      })
      .toPromise();
    return repoData;
  }

  async loadRepoDataDetailView(config: {
    search?: string;
    sort?: string;
    direction?: 'ASC' | 'DESC';
    page?: string;
    count?: string;
    includeForks?: string;
  }) {
    const repoData = await this.http
      .get<{
        repositories: Repository[];
        total: number;
      }>(`${environment.api}api/institutionRepositories`, {
        params: config,
      })
      .toPromise();
    return repoData;
  }

async loadAllUsers() {
  const userData = await this.http
    .get<{
      users: User[];
      total: number;
    }>(`${environment.api}api/completeUserData`, {})
    .toPromise();
    return userData;
  }
  
  async loadAllRepositories() {
    const repoData = await this.http
      .get<{
        repositories: Repository[];
        total: number;
      }>(`${environment.api}api/completeRepositoryData`, {})
      .toPromise();
      return repoData;
    }

  async loadAllInstitutions() {
    const institutionData = await this.http
      .get<{
        institutions: Institution[];
        total: number;
      }>(`${environment.api}api/completeInstitutionData`, {})
      .toPromise();
      return institutionData;
    }

  async loadAllOrganizations() {  
    const organizationData = await this.http
      .get<{
        organizations: Organization[];
        total: number;
      }>(`${environment.api}api/completeOrganizationData`, {})
      .toPromise();
      return organizationData;
    }

  async loadUserData(config: {
    search: string;
    sort: string;
    direction: 'ASC' | 'DESC';
    page: string;
    count: string;
  }) {
    const userData = await this.http
      .get<{
        users: User[];
        total: number;
      }>(`${environment.api}api/paginatedUsers`, {
        params: config,
      })
      .toPromise();
    return userData;
  }
}

export interface Metric {
  key: string;
  friendly_name: string;
  description: string;
}
