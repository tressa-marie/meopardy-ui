import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PlayerJoinComponent } from './player-join';

describe('PlayerJoinComponent', () => {
  it('requires a join code before making a request', () => {
    TestBed.configureTestingModule({ imports: [PlayerJoinComponent], providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
    ] });
    const component = TestBed.createComponent(PlayerJoinComponent).componentInstance;
    component.joinGame();
    expect(component.errorMessage).toBe('Enter the 6-character join code.');
    expect(component.loading).toBe(false);
  });

  it('places the hosted join QR code beside the form and outside its bordered panel', () => {
    TestBed.configureTestingModule({ imports: [PlayerJoinComponent], providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
    ] });
    const fixture = TestBed.createComponent(PlayerJoinComponent);
    fixture.detectChanges();
    const layout: HTMLElement = fixture.nativeElement.querySelector('.join-layout');
    const qr: HTMLElement = layout.querySelector('.join-qr')!;
    const panel: HTMLElement = layout.querySelector('.join-panel')!;
    expect(qr.parentElement).toBe(panel.parentElement);
    expect(qr.nextElementSibling).toBe(panel);
    expect(panel.querySelector('.join-qr')).toBeNull();
    expect(qr.querySelector('a')?.getAttribute('href')).toBe('https://jattam.onrender.com/join');
    expect(qr.querySelector('img')?.getAttribute('src')).toBe('images/join-qr.svg');
  });
});
