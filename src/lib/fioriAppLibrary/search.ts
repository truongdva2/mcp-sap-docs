import { FioriAppSearchResponse, FioriAppSearchResult } from "./types.js";
import { logger } from "../logger.js";
import { CONFIG } from "../config.js";

const FIORI_APP_LIBRARY_BASE = "https://fioriappslibrary.hana.ondemand.com/sap/fix/externalViewer/services/SingleApp.xsodata";

export interface FioriAppSearchOptions {
  query: string;
  top?: number;
}

export async function searchFioriAppLibrary(options: FioriAppSearchOptions): Promise<FioriAppSearchResult[]> {
  const { query, top = 50 } = options;
  
  // Wrap query in wildcards unless it already has them
  const searchTerm = query.includes("*") ? query : `*${query}*`;
  // Encode specifically for the OData filter value, including asterisks which encodeURIComponent ignores
  const encodedQuery = encodeURIComponent(searchTerm).replace(/\*/g, "%2A");
  
  // Construct URL string manually so that %2A doesn't get unescaped by new URL()
  const urlString = `${FIORI_APP_LIBRARY_BASE}/InputFilterParam(InpFilterValue='${encodedQuery}')/Results?$top=${top}&$format=json`;

  logger.info(`Searching SAP Fiori App Reference Library: ${urlString}`);

  try {
    const response = await fetch(urlString, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error(`SAP Fiori App Library API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to search Fiori App Library: ${response.statusText}`);
    }

    const data = await response.json() as FioriAppSearchResponse;
    const results = data?.d?.results || [];

    return results.map(app => {
      // Create a nice snippet
      const roles = app.RoleNameCombined ? app.RoleNameCombined.split(" * ")[0] : "Various Roles";
      const tech = app.UITechnologyCombined ? app.UITechnologyCombined.replace(/\$/g, "") : "Unknown UI";
      
      return {
        id: app.appId || "unknown",
        title: `${app.AppName || "Unknown App"} (${app.appId || "unknown"})`,
        url: `https://fioriappslibrary.hana.ondemand.com/sap/fix/externalViewer/#/detail/Apps('${app.appId}')/S30`,
        snippet: `${app.ApplicationType || "App"} | Tech: ${tech} | Primary Role: ${roles}`,
        metadata: {
          source: "sap-fiori-app-library",
          applicationType: app.ApplicationType,
          database: app.DatabaseCombined ? app.DatabaseCombined.replace(/\$/g, "") : undefined,
          releaseGroup: app.releaseGroupText
        }
      };
    });
  } catch (error) {
    logger.error("Error searching SAP Fiori App Library", { error });
    return [];
  }
}
