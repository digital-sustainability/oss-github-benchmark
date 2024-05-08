import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TokenService } from './services/token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private http: HttpClient, private tokenService: TokenService) { }

  login(username: string, password: string): Observable<any> {
    this.http.post(environment.api + "auth/login", {
      username,
      password
    }).subscribe((res: { access_token: string }) => {
      this.tokenService.setAccessToken(res.access_token)
    })
    return of(new HttpResponse({ status: 200 }));
 
  }

  logout(): void {
    this.tokenService.removeAccessToken()

  }

  isUserLoggedIn(): boolean {
    if (this.tokenService.getAccessToken() != null) {
      return true;
    }
    return false;
  }
}
