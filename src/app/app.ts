import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from './core/services/theme/theme.service';
import { SocketService } from './core/services/socket/socker.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly socketService = inject(SocketService);

  ngOnInit(): void {
    this.syncThemeFromUrl();
    this.socketService.onThemeChanged(theme => {
      this.themeService.setTheme(theme);
    });
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.syncThemeFromUrl());
  }

  private syncThemeFromUrl(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    const theme = urlTree.queryParams['theme'];

    if (this.themeService.isThemeName(theme)) {
      this.themeService.setTheme(theme);
    }
  }
}
