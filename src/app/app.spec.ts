import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('aplica data-theme no <html> já ao criar o app', () => {
    delete document.documentElement.dataset['theme'];

    TestBed.createComponent(App);

    expect(['light', 'dark']).toContain(document.documentElement.dataset['theme']);
    delete document.documentElement.dataset['theme'];
  });
});
