import { FioriAppResult, FioriAppSearchResponse } from "./types.js";
import { logger } from "../logger.js";
import { CONFIG } from "../config.js";

const FIORI_APP_LIBRARY_BASE = "https://fioriappslibrary.hana.ondemand.com/sap/fix/externalViewer/services/SingleApp.xsodata";

// Utility to clean the $ signs from combined strings
function cleanCombined(value: string | null | undefined): string {
  if (!value) return "N/A";
  return value.replace(/\$/g, "").split(" * ").filter(Boolean).join(", ");
}

export async function fetchFioriAppDetails(appId: string): Promise<string> {
  const url = new URL(`${FIORI_APP_LIBRARY_BASE}/InputFilterParam(InpFilterValue='${appId}')/Results`);
  url.searchParams.append("$top", "1");
  url.searchParams.append("$format", "json");

  logger.info(`Fetching SAP Fiori App Details: ${url.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error(`SAP Fiori App Library API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch Fiori App details: ${response.statusText}`);
    }

    const data = await response.json() as FioriAppSearchResponse;
    const results = data?.d?.results || [];
    
    // We want the exact match if possible
    let app = results.find(a => a.appId === appId);
    if (!app && results.length > 0) {
      app = results[0]; // fallback to the first result if exact match fails
    }

    if (!app) {
      return `No detailed information found for Fiori App ID: ${appId}`;
    }

    let markdown = `# ${app.AppName || "Unknown"} (${app.appId || "N/A"})\n\n`;
    
    markdown += `## General Information\n`;
    markdown += `- **Application Type:** ${app.ApplicationType || "N/A"}\n`;
    markdown += `- **UI Technology:** ${cleanCombined(app.UITechnologyCombined)}\n`;
    markdown += `- **Database:** ${cleanCombined(app.DatabaseCombined)}\n`;
    markdown += `- **Release Group:** ${cleanCombined(app.releaseGroupText)}\n`;
    markdown += `- **Form Factors:** ${cleanCombined(app.FormFactorsCombined)}\n\n`;

    markdown += `## Technical Catalog & Roles\n`;
    markdown += `- **Technical Catalog:** ${app.TechnicalCatalog || "N/A"}\n`;
    markdown += `- **Business Catalog:** ${app.BusinessCatalog || "N/A"}\n`;
    markdown += `- **Business Role(s):** ${cleanCombined(app.RoleNameCombined)}\n\n`;

    markdown += `## Software Components\n`;
    markdown += `- **Frontend Component:** ${cleanCombined(app.FrontendSCVCombined)}\n`;
    markdown += `- **Backend Component:** ${cleanCombined(app.BackendSCVCombined)}\n\n`;

    if (app.ODataServicesCombined) {
      markdown += `## OData Services\n`;
      const services = cleanCombined(app.ODataServicesCombined).split(", ");
      services.forEach(s => {
        markdown += `- ${s}\n`;
      });
      markdown += `\n`;
    }

    if (app.PVFrontendCombined || app.PVBackendCombined) {
      markdown += `## Supported Product Versions\n`;
      markdown += `- **Frontend:** ${cleanCombined(app.PVFrontendCombined)}\n`;
      markdown += `- **Backend:** ${cleanCombined(app.PVBackendCombined)}\n\n`;
    }

    const detailUrl = `https://fioriappslibrary.hana.ondemand.com/sap/fix/externalViewer/#/detail/Apps('${app.appId}')/S30`;
    markdown += `\n\n[View in SAP Fiori Apps Reference Library](${detailUrl})`;

    return markdown;
  } catch (error) {
    logger.error(`Error fetching Fiori App ${appId}`, { error });
    throw error;
  }
}
