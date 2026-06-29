import { AcceleratorHubSearchResult, AcceleratorHubSearchResponse } from "./types.js";
import { logger } from "../logger.js";
import { CONFIG } from "../config.js";

const API_HUB_BASE_URL = "https://api.sap.com/odata/1.0/catalog.svc";

export interface AcceleratorHubSearchOptions {
  query: string;
  top?: number;
}

export async function searchAcceleratorHub(options: AcceleratorHubSearchOptions): Promise<AcceleratorHubSearchResult[]> {
  const { query, top = 50 } = options;
  const url = new URL(`${API_HUB_BASE_URL}/APIContent.APIs`);
  
  const safeQuery = query.replace(/'/g, "''");
  const filterParams = `substringof('${safeQuery}', Name) eq true or substringof('${safeQuery}', Title) eq true`;
  url.searchParams.append("$filter", filterParams);
  url.searchParams.append("$top", top.toString());
  url.searchParams.append("$format", "json");

  // Fix URLSearchParams encoding '+' for spaces which some OData services reject
  const urlString = url.toString().replace(/\+/g, "%20");

  logger.info(`Searching SAP Accelerator Hub: ${urlString}`);

  try {
    const headers: Record<string, string> = {
      "Accept": "application/json"
    };

    if (process.env.SAP_API_HUB_KEY) {
      headers["APIKey"] = process.env.SAP_API_HUB_KEY;
    }

    const response = await fetch(urlString, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error(`SAP Accelerator Hub API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to search Accelerator Hub: ${response.statusText}`);
    }

    const data = await response.json() as AcceleratorHubSearchResponse;
    const results = data?.d?.results || [];

    return results.map(api => ({
      id: api.Name,
      title: api.Title || api.Name,
      url: `https://api.sap.com/api/${api.Name}`,
      snippet: api.ShortText || api.Description || "No description available",
      metadata: {
        source: "sap-accelerator-hub",
        state: api.State,
        version: api.Version,
        serviceCode: api.ServiceCode
      }
    }));
  } catch (error) {
    logger.error("Error searching SAP Accelerator Hub", { error });
    return [];
  }
}
