export interface SearchPoiDto {
  query: string;
  limit?: number;
  lat?: number;
  lon?: number;
  radius?: number;
}

export interface PlaceDetailsDto {
  entityId: string;
  language?: string;
  openingHours?: boolean;
  timeZone?: boolean;
  mapcodes?: boolean;
  relatedPois?: boolean;
  view?: 'Unified' | 'US';
}

export interface ChatWithAgentDto {
  message: string;
  sessionId?: string;
}
