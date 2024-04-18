import { Component, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { TokenService } from '../services/token.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  public isMenuOpen: boolean = false;
  constructor(private tokenService: TokenService) {}

  ngOnInit(): void {}

  onSidenavClick(): void {
    this.isMenuOpen = false;
  }
  logout(): void {
    this.tokenService.removeAccessToken()
    window.location.reload();
  }
}
