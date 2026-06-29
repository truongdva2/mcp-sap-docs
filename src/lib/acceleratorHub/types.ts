export interface AcceleratorHubApi {
  Name: string;
  ID: string;
  Title: string;
  ShortText: string;
  Description: string | null;
  ServiceCode: string | null;
  Version: string | null;
  State: string | null;
  [key: string]: any;
}

export interface AcceleratorHubSearchResponse {
  d?: {
    results?: AcceleratorHubApi[];
  };
}

export interface AcceleratorHubSearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  metadata?: Record<string, any>;
}
