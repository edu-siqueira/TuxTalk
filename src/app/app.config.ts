import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { TuxPreset, TUX_DARK_MODE_SELECTOR } from './theme/tux-preset';
import { authInterceptor } from './interceptors/auth.interceptor';

// Pipes de data/número (DatePipe, DecimalPipe...) em português do Brasil.
registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
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
