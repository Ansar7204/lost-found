// Production settings. `ng build` uses this file.
// `ng serve` swaps in environment.development.ts (see fileReplacements in angular.json).
import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  /** Base URL of the ASP.NET Core API (served from the same domain). */
  apiBaseUrl: '/api',
  auth: {
    /** Real Microsoft Entra ID sign-in with the KBTU account (US-01). */
    mode: 'msal',
    msal: {
      clientId: '51c93c36-83bc-464e-8229-2d739b278dc7',
      tenantId: '57081b5e-e66a-4993-8eaf-15b0b309293f',
      apiScope: 'api://51c93c36-83bc-464e-8229-2d739b278dc7/access_as_user',
    },
  },
};
