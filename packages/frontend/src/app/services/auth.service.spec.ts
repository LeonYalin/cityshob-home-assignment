import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Handle the automatic getCurrentUser call from constructor
    // Environment uses window.location.origin which in tests is http://localhost:9876
    const initialReq = httpMock.expectOne('http://localhost:9876/api/auth/me');
    initialReq.error(new ProgressEvent('error'));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial state as not authenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should handle login request', () => {
    const mockResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: '2025-11-01T00:00:00Z',
          updatedAt: '2025-11-01T00:00:00Z'
        }
      }
    };

    service.login({ email: 'test@example.com', password: 'password' }).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(mockResponse.data.user);
    });

    const req = httpMock.expectOne('http://localhost:9876/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
