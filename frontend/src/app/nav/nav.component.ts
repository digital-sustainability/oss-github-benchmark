import { Component, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  public isMenuOpen: boolean = false;
  constructor() {}

  ngOnInit(): void {}

  onSidenavClick(): void {
    this.isMenuOpen = false;
  }
}
