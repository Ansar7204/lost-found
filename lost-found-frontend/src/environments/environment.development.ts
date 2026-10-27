import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  /** Proxied to http://localhost:5043 by proxy.conf.json, so no CORS setup is needed in dev. */
  apiBaseUrl: '/api',
  auth: {
    /**
     * 'dev': sign in with any @kbtu.kz email, no Microsoft account needed. The API must run with
     * Auth:Mode = "Dev" (the default in appsettings.Development.json).
     * Switch both to 'msal' / "Entra" to test the real Microsoft sign-in locally.
     */
    mode: 'dev',
    msal: {
      clientId: '51c93c36-83bc-464e-8229-2d739b278dc7',
      tenantId: '57081b5e-e66a-4993-8eaf-15b0b309293f',
      apiScope: 'api://51c93c36-83bc-464e-8229-2d739b278dc7/access_as_user',
    },
  },
};
