import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { TuxPreset, TUX_DARK_MODE_SELECTOR } from './theme/tux-preset';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
            theme: {
                preset: TuxPreset,
                options: { darkModeSelector: TUX_DARK_MODE_SELECTOR }
            }
        })
  ]
};
