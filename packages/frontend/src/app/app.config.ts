import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuthService } from './services/auth.service';
import { WebSocketService } from './services/websocket.service';
import { GlobalErrorHandler } from './services/error-handler.service';

import { routes } from './app.routes';

// Initialize WebSocket service with AuthService
function initializeWebSocketFactory(
  authService: AuthService,
  wsService: WebSocketService
) {
  return () => {
    // Connect WebSocket service to AuthService
    authService.setWebSocketService(wsService);
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    provideNoopAnimations(),
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeWebSocketFactory,
      deps: [AuthService, WebSocketService],
      multi: true
    }
  ]
};
