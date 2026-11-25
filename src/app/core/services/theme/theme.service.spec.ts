import { ThemeService } from './theme.service';

describe.each(['olive-garden', 'autumn-glow'] as const)('%s theme', theme => {
  let previousTheme: string | null;
  let previousAttribute: string | null;

  beforeEach(() => {
    previousTheme = localStorage.getItem('meopardy-theme');
    previousAttribute = document.documentElement.getAttribute('data-theme');
    localStorage.removeItem('meopardy-theme');
  });
  afterEach(() => {
    if (previousTheme === null) localStorage.removeItem('meopardy-theme');
    else localStorage.setItem('meopardy-theme', previousTheme);
    if (previousAttribute === null) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', previousAttribute);
  });

  it('is available in Settings and is recognized as a valid saved theme', () => {
    const service = new ThemeService();
    expect(service.getThemes()).toContain(theme);
    expect(service.isThemeName(theme)).toBe(true);
    service.setTheme(theme);
    expect(localStorage.getItem('meopardy-theme')).toBe(theme);
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
  });

  it('restores the selected theme across refreshes', () => {
    localStorage.setItem('meopardy-theme', theme);
    const service = new ThemeService();
    expect(service.getSavedTheme()).toBe(theme);
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
  });
});
