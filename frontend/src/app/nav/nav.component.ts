import { Component, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { TokenService } from '../services/token.service';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  public isMenuOpen: boolean = false;
  constructor(private tokenService: TokenService, private authService: AuthenticationService) {}

  ngOnInit(): void {}


  isLoggedIn(): boolean {
    return this.authService.isUserLoggedIn();
  }

  onSidenavClick(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.tokenService.removeAccessToken()
    window.location.reload();
  }
}
