import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TokenService } from './services/token.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  login(username: string, password: string): Observable<any> {
    this.http.post<{ access_token: string }>(environment.api + "auth/login", {
      username,
      password
    }).subscribe(
      (res) => {
        this.tokenService.setAccessToken(res.access_token);
        this.router.navigate(['/add-institution']);
        this.toastr.success('Login Successful');
      },
      (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.toastr.show('Invalid username or password', 'Login Failed');
        } else {
          this.toastr.error('An unexpected error occurred', 'Login Failed');
        }
      }
    );
    return of(new HttpResponse({ status: 200 }));
  }

  logout(): void {
    this.tokenService.removeAccessToken();
  }

  isUserLoggedIn(): boolean {
    return this.tokenService.getAccessToken() != null;
  }
}
