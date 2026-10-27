/**
 * 'msal' — Microsoft Entra ID (the real KBTU sign-in): the SPA gets an access token for the API.
 * 'dev'  — local development: the API trusts an `X-Dev-User: <email>` header (Development only).
 */
export type AuthMode = 'msal' | 'dev';

export interface MsalSettings {
  /** Application (client) id of the SPA registration in Entra ID. */
  clientId: string;
  /** Directory (tenant) id, or 'organizations' for any work/school account. */
  tenantId: string;
  /** The API scope, e.g. api://<api-client-id>/access_as_user */
  apiScope: string;
}

export interface AppEnvironment {
  production: boolean;
  apiBaseUrl: string;
  auth: {
    mode: AuthMode;
    msal: MsalSettings;
  };
}
