import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { tokenInterceptor } from './auth/token-interceptor.service';
import { definePreset } from '@primeuix/themes';
import { provideServiceWorker } from '@angular/service-worker';


const myAura = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0fbff',
      100: '#e0f7ff',
      200: '#baeeff',
      300: '#7dddff',
      400: '#38c9ff',
      500: '#019FE2',
      600: '#0082c4',
      700: '#0268a0',
      800: '#065a84',
      900: '#0b4b6e'
    }
  },
  primitive: {
    fontSize: {
      xs: '0.7rem',     // Più leggibile (era 0.75rem originale)
      sm: '0.8rem',     // Più leggibile (era 0.875rem originale)
      base: '0.85rem',  // Dimensione di base equilibrata (era 1rem originale)
      lg: '1rem',       // Più leggibile (era 1.125rem originale)
      xl: '1.1rem',     // Più leggibile (era 1.25rem originale)
      '2xl': '1.3rem',  // Più leggibile (era 1.5rem originale)
      '3xl': '1.6rem',  // Più leggibile (era 1.875rem originale)
      '4xl': '2rem',    // Più leggibile (era 2.25rem originale)
      '5xl': '2.5rem',  // Più leggibile (era 3rem originale)
      '6xl': '3rem'     // Più leggibile (era 3.75rem originale)
    },
    lineHeight: {
      xs: '1rem',       // Proporzionale e leggibile
      sm: '1.2rem',
      base: '1.4rem',   // Line height equilibrato
      lg: '1.5rem',
      xl: '1.7rem',
      '2xl': '1.8rem',
      '3xl': '2rem',
      '4xl': '2.5rem',
      '5xl': '3rem',
      '6xl': '3.5rem'
    }
  }
});export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),


    provideHttpClient(withFetch(), withInterceptors([tokenInterceptor])),
    provideAnimations(),
    providePrimeNG({ theme: { preset: myAura, options: { darkModeSelector: '.app-dark' } } }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })    
  ]
};
