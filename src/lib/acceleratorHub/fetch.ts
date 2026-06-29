import { AcceleratorHubApi } from "./types.js";
import { logger } from "../logger.js";
import { CONFIG } from "../config.js";

const API_HUB_BASE_URL = "https://api.sap.com/odata/1.0/catalog.svc";

export async function fetchAcceleratorHubApi(id: string): Promise<string> {
  const url = new URL(`${API_HUB_BASE_URL}/APIContent.APIs('${id}')`);
  url.searchParams.append("$format", "json");

  logger.info(`Fetching SAP Accelerator Hub API Details: ${url.toString()}`);

  try {
    const headers: Record<string, string> = {
      "Accept": "application/json"
    };

    if (process.env.SAP_API_HUB_KEY) {
      headers["APIKey"] = process.env.SAP_API_HUB_KEY;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error(`SAP Accelerator Hub API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch Accelerator Hub API details: ${response.statusText}`);
    }

    const data = await response.json() as { d?: AcceleratorHubApi };
    const api = data?.d;

    if (!api) {
      return `No detailed information found for API ID: ${id}`;
    }

    // Format the response into Markdown
    let markdown = `# ${api.Title || api.Name} (${api.Name})\n\n`;
    
    if (api.ShortText) markdown += `> ${api.ShortText}\n\n`;
    if (api.Description) markdown += `## Description\n\n${api.Description}\n\n`;

    markdown += `## Technical Details\n`;
    markdown += `- **Version:** ${api.Version || "N/A"}\n`;
    markdown += `- **State:** ${api.State || "N/A"}\n`;
    markdown += `- **Service Code:** ${api.ServiceCode || "N/A"}\n`;
    
    if (api.ServiceUrl) {
      markdown += `- **Service URL:** [${api.ServiceUrl}](${api.ServiceUrl})\n`;
    }

    if (api.ExternalDocs) {
      markdown += `- **External Docs:** ${api.ExternalDocs}\n`;
    }

    if (api.ChangeLog) {
      try {
        const changes = JSON.parse(api.ChangeLog);
        if (Array.isArray(changes) && changes.length > 0) {
          markdown += `\n## Change Log\n`;
          changes.slice(0, 5).forEach((change: any) => {
            markdown += `- **${change.date} (v${change.version}):** ${change.state} - ${change.notes || "No notes"}\n`;
          });
        }
      } catch (e) {
        // Ignore parse error
      }
    }

    markdown += `\n\n[View on SAP Accelerator Hub](https://api.sap.com/api/${api.Name})`;

    return markdown;
  } catch (error) {
    logger.error(`Error fetching Accelerator Hub API ${id}`, { error });
    throw error;
  }
}
