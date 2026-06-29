export interface FioriAppResult {
  appId: string;
  AppName: string;
  ApplicationType: string | null;
  RoleNameCombined: string | null;
  BusinessCatalog: string | null;
  TechnicalCatalog: string | null;
  FrontendSoftwareComponent: string | null;
  ODataServicesCombined: string | null;
  PVFrontendCombined: string | null;
  PVBackendCombined: string | null;
  PrimaryPVOfficialNameCombined: string | null;
  UITechnologyCombined: string | null;
  DatabaseCombined: string | null;
  releaseGroupText: string | null;
  productInstanceUI: string | null;
  productInstanceBE: string | null;
  [key: string]: any;
}

export interface FioriAppSearchResponse {
  d?: {
    results?: FioriAppResult[];
  };
}

export interface FioriAppSearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  metadata?: Record<string, any>;
}
