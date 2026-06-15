import { Injectable } from "@nestjs/common";
import { DynamicsAuthService } from "./dynamics-auth.service.js";

@Injectable()
export class DynamicsApiClient {
  constructor(private readonly auth: DynamicsAuthService) {}

  async request<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown, etag?: string): Promise<T> {
    const token = await this.auth.getAccessToken();
    const url = `${process.env.DYNAMICS_ORG_URL}/api/data/v${process.env.DYNAMICS_API_VERSION ?? "9.2"}/${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "OData-Version": "4.0",
        "OData-MaxVersion": "4.0",
        ...(etag ? { "If-Match": etag } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dynamics ${method} ${path} failed: ${response.status} ${text.slice(0, 500)}`);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async getAll<T>(table: string, query: string) {
    const records: T[] = [];
    let path = `${table}?${query}`;
    while (path) {
      const page = await this.request<{ value: T[]; "@odata.nextLink"?: string }>("GET", path);
      records.push(...page.value);
      path = page["@odata.nextLink"]?.split(`/api/data/v${process.env.DYNAMICS_API_VERSION ?? "9.2"}/`)[1] ?? "";
    }
    return records;
  }
}
