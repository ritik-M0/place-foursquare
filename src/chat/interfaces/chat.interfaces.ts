export interface ConversationContext {
  sessionId: string;
  userId?: string;
  conversationHistory: ChatMessage[];
  locationContext?: GeoLocation;
  preferences?: UserPreferences;
  lastMapData?: any; // GeoJSON FeatureCollection
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    queryType?: string;
    confidence?: number;
    processingTime?: number;
  };
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface UserPreferences {
  language?: string;
  units?: 'metric' | 'imperial';
  radius?: number;
  categories?: string[];
}

export interface ChatAttachment {
  type: 'image' | 'link' | 'map' | 'data';
  url?: string;
  data?: any;
  metadata?: any;
}

export interface SuggestedAction {
  type: 'query' | 'action' | 'filter';
  label: string;
  action: string;
  parameters?: any;
}

export interface MastraAgentResponse {
  type: string;
  data: {
    summary: {
      queryType: string;
      extractedEntities: any;
      analysis: {
        text: string;
        confidence: number;
      };
    };
    mapData: any; // GeoJSON FeatureCollection
  };
  metadata: any;
  success: boolean;
  timestamp: string;
}
