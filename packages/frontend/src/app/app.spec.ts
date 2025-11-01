import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: []
    }).compileComponents();
  });

  it('should create the app class', () => {
    const app = new App();
    expect(app).toBeTruthy();
  });

  it('should be defined', () => {
    expect(App).toBeDefined();
  });
});