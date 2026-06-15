import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfidentialClientApplication } from "@azure/msal-node";

@Injectable()
export class DynamicsAuthService {
  private cached?: { token: string; expiresAt: number };

  async getAccessToken() {
    if (this.cached && this.cached.expiresAt > Date.now() + 60_000) return this.cached.token;
    if (!process.env.DYNAMICS_TENANT_ID || !process.env.DYNAMICS_CLIENT_ID || !process.env.DYNAMICS_ORG_URL) {
      throw new ServiceUnavailableException("Dynamics is not configured.");
    }
    if (!process.env.DYNAMICS_CLIENT_SECRET) {
      throw new ServiceUnavailableException("Dynamics client-secret authentication is not configured. Certificate auth can be added through the configured certificate path.");
    }

    const app = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.DYNAMICS_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.DYNAMICS_TENANT_ID}`,
        clientSecret: process.env.DYNAMICS_CLIENT_SECRET
      }
    });
    const result = await app.acquireTokenByClientCredential({
      scopes: [`${process.env.DYNAMICS_ORG_URL}/.default`]
    });
    if (!result?.accessToken) throw new ServiceUnavailableException("Unable to acquire Dynamics access token.");
    this.cached = { token: result.accessToken, expiresAt: result.expiresOn?.getTime() ?? Date.now() + 45 * 60_000 };
    return result.accessToken;
  }
}
