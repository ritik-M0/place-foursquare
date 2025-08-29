import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const baseURL = 'https://areainsights.googleapis.com/v1:computeInsights';

// Enhanced location filter with better validation
const locationFilterSchema = z.object({
  circle: z.object({
    latLng: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
    place: z.string().describe("Place ID for center. Must start with 'places/'").optional(),
    radius: z.number().min(1).max(50000).describe('Radius in meters (1-50000)'),
  }).optional(),
  region: z.object({
    place: z.string().describe("Place ID of the region. Must start with 'places/'"),
  }).optional(),
  customArea: z.object({
    polygon: z.object({
      coordinates: z.array(z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })),
    }),
  }).optional(),
}).refine(data => 
  (data.circle && (data.circle.latLng || data.circle.place)) || data.region || data.customArea,
  { message: "At least one location filter (circle, region, or customArea) must be specified" }
);

// Enhanced type filter with business intelligence focus
const typeFilterSchema = z.object({
  includedTypes: z.array(z.string()).optional().describe('General place types (restaurant, store, etc.)'),
  excludedTypes: z.array(z.string()).optional().describe('Types to exclude'),
  includedPrimaryTypes: z.array(z.string()).optional().describe('Primary business types for focused analysis'),
  excludedPrimaryTypes: z.array(z.string()).optional().describe('Primary types to exclude'),
}).refine(data => 
  data.includedTypes?.length || data.includedPrimaryTypes?.length,
  { message: "At least one of includedTypes or includedPrimaryTypes must be specified" }
);

const ratingFilterSchema = z.object({
  minRating: z.number().min(1.0).max(5.0).optional(),
  maxRating: z.number().min(1.0).max(5.0).optional(),
});

// Business Intelligence presets for common use cases
const BUSINESS_INTELLIGENCE_PRESETS = {
  RETAIL_COMPETITION: {
    includedPrimaryTypes: ['clothing_store', 'electronics_store', 'department_store', 'shopping_mall'],
    operatingStatus: ['OPERATING_STATUS_OPERATIONAL'],
    description: 'Analyze retail competition in an area'
  },
  FOOD_SERVICE: {
    includedPrimaryTypes: ['restaurant', 'cafe', 'fast_food_restaurant', 'meal_takeaway'],
    operatingStatus: ['OPERATING_STATUS_OPERATIONAL'],
    description: 'Food service business analysis'
  },
  REAL_ESTATE_COMMERCIAL: {
    includedTypes: ['real_estate_agency', 'moving_company', 'storage'],
    operatingStatus: ['OPERATING_STATUS_OPERATIONAL'],
    description: 'Commercial real estate services'
  },
  PROFESSIONAL_SERVICES: {
    includedPrimaryTypes: ['lawyer', 'accounting', 'dentist', 'doctor', 'veterinary_care'],
    operatingStatus: ['OPERATING_STATUS_OPERATIONAL'],
    description: 'Professional service providers'
  },
  FITNESS_WELLNESS: {
    includedPrimaryTypes: ['gym', 'spa', 'beauty_salon', 'physiotherapist'],
    operatingStatus: ['OPERATING_STATUS_OPERATIONAL'],
    description: 'Health and wellness businesses'
  }
};

export const getGooglePlacesInsightsTool = createTool({
  id: 'get-google-places-insights',
  description: `Advanced business intelligence tool using Google Places Insights API. Provides market analysis, competitor research, and location intelligence for business decisions, real estate analysis, and professional services planning.

  Key capabilities:
  - Market density analysis (competitor counts)
  - Location-based business intelligence
  - Real estate market research
  - Professional service area analysis
  - Price level and rating distribution analysis`,
  
  inputSchema: z.object({
    insights: z.array(z.enum(['INSIGHT_COUNT', 'INSIGHT_PLACES'])).describe('INSIGHT_COUNT for market analysis, INSIGHT_PLACES for detailed competitor lists'),
    filter: z.object({
      locationFilter: locationFilterSchema,
      typeFilter: typeFilterSchema,
      operatingStatus: z.array(z.enum([
        'OPERATING_STATUS_UNSPECIFIED', 
        'OPERATING_STATUS_OPERATIONAL', 
        'OPERATING_STATUS_TEMPORARILY_CLOSED', 
        'OPERATING_STATUS_PERMANENTLY_CLOSED'
      ])).optional().default(['OPERATING_STATUS_OPERATIONAL']),
      priceLevels: z.array(z.enum([
        'PRICE_LEVEL_UNSPECIFIED',
        'PRICE_LEVEL_FREE', 
        'PRICE_LEVEL_INEXPENSIVE', 
        'PRICE_LEVEL_MODERATE', 
        'PRICE_LEVEL_EXPENSIVE', 
        'PRICE_LEVEL_VERY_EXPENSIVE'
      ])).optional(),
      ratingFilter: ratingFilterSchema.optional(),
    }),
    // Business intelligence context
    analysisType: z.enum([
      'MARKET_DENSITY', 
      'COMPETITOR_ANALYSIS', 
      'LOCATION_SUITABILITY', 
      'PRICE_ANALYSIS',
      'CUSTOM'
    ]).optional().default('CUSTOM').describe('Type of business analysis to perform'),
    businessContext: z.object({
      industry: z.string().optional().describe('Target industry (retail, food, professional services, etc.)'),
      targetCustomers: z.string().optional().describe('Target customer demographics'),
      businessModel: z.string().optional().describe('Business model (B2B, B2C, franchise, etc.)'),
    }).optional(),
  }),
  
  outputSchema: z.object({
    count: z.string().optional().describe('Number of places matching the filter'),
    places: z.array(z.string()).optional().describe('Place IDs matching the filter'),
    businessIntelligence: z.object({
      marketDensity: z.string().optional().describe('Market density assessment'),
      competitionLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'SATURATED']).optional(),
      recommendations: z.array(z.string()).optional().describe('Business recommendations based on analysis'),
      riskFactors: z.array(z.string()).optional().describe('Potential risks identified'),
    }).optional(),
    metadata: z.object({
      analysisType: z.string(),
      searchRadius: z.number().optional(),
      filterCriteria: z.record(z.any()),
      timestamp: z.string(),
    }),
  }),
  
  execute: async ({ context }) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not found. Please set the GOOGLE_API_KEY environment variable.');
    }

    // Apply business intelligence presets if applicable
    let enhancedFilter = { ...context.filter };
    if (context.businessContext?.industry) {
      const preset = Object.values(BUSINESS_INTELLIGENCE_PRESETS).find(p => 
        p.description.toLowerCase().includes(context.businessContext!.industry!.toLowerCase())
      );
      if (preset) {
        enhancedFilter = {
          ...enhancedFilter,
          typeFilter: {
            ...enhancedFilter.typeFilter,
            ...preset
          }
        };
      }
    }

    const requestBody = {
      insights: context.insights,
      filter: enhancedFilter
    };

    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Google Places Insights API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    
    // Parse API response correctly based on documentation
    let result: any = {
      metadata: {
        analysisType: context.analysisType || 'CUSTOM',
        filterCriteria: enhancedFilter,
        timestamp: new Date().toISOString(),
      }
    };

    // Handle count insights
    if (data.count !== undefined) {
      result.count = data.count;
    }

    // Handle place insights - correct parsing based on API docs
    if (data.placeInsights && Array.isArray(data.placeInsights)) {
      result.places = data.placeInsights.map((insight: any) => insight.place);
    }

    // Add business intelligence analysis
    if (context.analysisType && context.analysisType !== 'CUSTOM') {
      const count = parseInt(data.count || '0');
      const radius = enhancedFilter.locationFilter?.circle?.radius || 1000;
      
      result.businessIntelligence = generateBusinessIntelligence(
        count, 
        radius, 
        context.analysisType, 
        context.businessContext
      );
      
      if (enhancedFilter.locationFilter?.circle?.radius) {
        result.metadata.searchRadius = enhancedFilter.locationFilter.circle.radius;
      }
    }

    return result;
  },
});

// Business intelligence analysis function
function generateBusinessIntelligence(
  count: number, 
  radius: number, 
  analysisType: string, 
  businessContext?: any
): any {
  const density = count / (Math.PI * Math.pow(radius / 1000, 2)); // businesses per km²
  
  let competitionLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SATURATED';
  let recommendations: string[] = [];
  let riskFactors: string[] = [];

  // Determine competition level based on density
  if (density < 1) {
    competitionLevel = 'LOW';
    recommendations.push('Market opportunity exists with low competition');
    recommendations.push('Consider being a market pioneer in this area');
  } else if (density < 5) {
    competitionLevel = 'MODERATE';
    recommendations.push('Balanced market with room for differentiation');
    recommendations.push('Focus on unique value proposition');
  } else if (density < 15) {
    competitionLevel = 'HIGH';
    recommendations.push('Highly competitive market - strong differentiation required');
    riskFactors.push('High competition may impact market share');
  } else {
    competitionLevel = 'SATURATED';
    recommendations.push('Market appears saturated - consider alternative locations');
    riskFactors.push('Market saturation may limit growth potential');
    riskFactors.push('High customer acquisition costs likely');
  }

  // Analysis type specific insights
  switch (analysisType) {
    case 'MARKET_DENSITY':
      recommendations.push(`Market density: ${density.toFixed(2)} businesses per km²`);
      break;
    case 'COMPETITOR_ANALYSIS':
      recommendations.push(`${count} direct competitors identified in ${radius}m radius`);
      if (count > 10) {
        riskFactors.push('High number of competitors may indicate market saturation');
      }
      break;
    case 'LOCATION_SUITABILITY':
      if (competitionLevel === 'LOW') {
        recommendations.push('Location shows good potential for new business entry');
      } else if (competitionLevel === 'SATURATED') {
        recommendations.push('Consider alternative locations with less competition');
      }
      break;
  }

  // Business context specific recommendations
  if (businessContext?.businessModel === 'franchise') {
    recommendations.push('Franchise model may benefit from established brand recognition');
    if (competitionLevel === 'HIGH') {
      recommendations.push('Strong franchise support will be crucial in competitive market');
    }
  }

  return {
    marketDensity: `${density.toFixed(2)} businesses per km² (${count} total in ${radius}m radius)`,
    competitionLevel,
    recommendations,
    riskFactors: riskFactors.length > 0 ? riskFactors : undefined,
  };
}
