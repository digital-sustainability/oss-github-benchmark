import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  fakeUsername: string = "username";
  fakePassword: string = "password";

  constructor() { }

  login(username: string, password: string): Observable<any> {
    // Mock a successful call to an API server.
    if (username == this.fakeUsername && password == this.fakePassword) {
      localStorage.setItem("token", "my-super-secret-token-from-server");
      return of(new HttpResponse({ status: 200 }));
    } else {
      return of(new HttpResponse({ status: 401 }));
    }
  }

  logout(): void {
    localStorage.removeItem("token");
  }

  isUserLoggedIn(): boolean {
    if (localStorage.getItem("token") != null) {
      return true;
    }
    return false;
  }
}
