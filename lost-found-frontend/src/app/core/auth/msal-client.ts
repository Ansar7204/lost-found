import type { AccountInfo, PublicClientApplication } from '@azure/msal-browser';
import { MsalSettings } from '../../../environments/environment.model';

/**
 * Thin wrapper over @azure/msal-browser (Microsoft Entra ID sign-in).
 *
 * The library is loaded with a dynamic import(), so it is downloaded only when
 * the app actually runs in 'msal' mode; dev builds don't pay for it.
 *
 * Entra ID setup it expects (Azure portal → App registrations):
 *  - Platform "Single-page application" with redirect URI = the site origin
 *    (http://localhost:4200 for `ng serve`, and the production URL).
 *  - "Expose an API" with the scope `access_as_user` (already used by the backend).
 */
export class MsalClient {
  private pca?: PublicClientApplication;

  constructor(private readonly settings: MsalSettings) {}

  /**
   * Start MSAL and finish a sign-in redirect if we are coming back from Microsoft.
   * Returns the signed-in account (or null) and the `state` we sent (the page to return to).
   */
  async init(): Promise<{ account: AccountInfo | null; returnTo?: string }> {
    const msal = await import('@azure/msal-browser');
    this.pca = new msal.PublicClientApplication({
      auth: {
        clientId: this.settings.clientId,
        authority: `https://login.microsoftonline.com/${this.settings.tenantId}`,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
      },
      cache: { cacheLocation: msal.BrowserCacheLocation.LocalStorage },
    });
    await this.pca.initialize();

    const result = await this.pca.handleRedirectPromise();
    const account = result?.account ?? this.pca.getActiveAccount() ?? this.pca.getAllAccounts()[0];
    if (account) this.pca.setActiveAccount(account);

    return { account: account ?? null, returnTo: result?.state };
  }

  /** Go to the Microsoft sign-in page. `returnTo` comes back as `state`. */
  async signIn(returnTo: string, loginHint?: string): Promise<void> {
    await this.client().loginRedirect({
      scopes: [this.settings.apiScope],
      state: returnTo,
      loginHint,
      prompt: 'select_account',
    });
  }

  async signOut(): Promise<void> {
    await this.client().logoutRedirect({ account: this.client().getActiveAccount() });
  }

  /** Access token for the API. Renews silently; falls back to a redirect when it must. */
  async accessToken(): Promise<string> {
    const msal = await import('@azure/msal-browser');
    const pca = this.client();
    const account = pca.getActiveAccount();
    if (!account) throw new Error('Not signed in');

    const request = { scopes: [this.settings.apiScope], account };
    try {
      return (await pca.acquireTokenSilent(request)).accessToken;
    } catch (error) {
      if (error instanceof msal.InteractionRequiredAuthError) {
        await pca.acquireTokenRedirect({ ...request, state: location.pathname + location.search });
      }
      throw error;
    }
  }

  private client(): PublicClientApplication {
    if (!this.pca) throw new Error('MSAL is not initialized');
    return this.pca;
  }
}
