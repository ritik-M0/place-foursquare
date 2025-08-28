ExecutePlanTool results: {
  "getAggregatedMetricTool": {
    "error": true,
    "message": "Tool validation failed for get-aggregated-metric. Please fix the following errors and try again:\n- search_query: Required\n- location: Required\n- aggregation_type: Required\n\nProvided arguments: {}",
    "validationErrors": {
      "_errors": [],
      "search_query": {
        "_errors": [
          "Required"
        ]
      },
      "location": {
        "_errors": [
          "Required"
        ]
      },
      "aggregation_type": {
        "_errors": [
          "Required"
        ]
      }
    }
  },
  "tomtomFuzzySearchTool": {
    "error": true,
    "message": "Tool validation failed for tomtom-fuzzy-search. Please fix the following errors and try again:\n- query: Required\n\nProvided arguments: {}",
    "validationErrors": {
      "_errors": [],
      "query": {
        "_errors": [
          "Required"
        ]
      }
    }
  }
}
ExecutePlanTool results: {
  "getAggregatedMetricTool": {
    "error": true,
    "message": "Tool validation failed for get-aggregated-metric. Please fix the following errors and try again:\n- search_query: Required\n- location: Required\n- aggregation_type: Required\n\nProvided arguments: {}",
    "validationErrors": {
      "_errors": [],
      "search_query": {
        "_errors": [
          "Required"
        ]
      },
      "location": {
        "_errors": [
          "Required"
        ]
      },
      "aggregation_type": {
        "_errors": [
          "Required"
        ]
      }
    }
  },
  "tomtomFuzzySearchTool": {
    "error": true,
    "message": "Tool validation failed for tomtom-fuzzy-search. Please fix the following errors and try again:\n- query: Required\n\nProvided arguments: {}",
    "validationErrors": {
      "_errors": [],
      "query": {
        "_errors": [
          "Required"
        ]
      }
    }
  }
}
ExecutePlanTool results: {
  "getAggregatedMetricTool": {
    "result": 100,
    "description": "Found a total of 100 fast-food restaurant in Austin, Texas."
  },
  "tomtomFuzzySearchTool": {
    "summary": {
      "query": "high foot traffic areas",
      "queryType": "NON_NEAR",
      "queryTime": 449,
      "numResults": 3,
      "offset": 0,
      "totalResults": 3,
      "fuzzyLevel": 2,
      "geoBias": {
        "lat": 30.264979,
        "lon": -97.746598
      },
      "queryIntent": []
    },
    "results": [
      {
        "type": "POI",
        "id": "InZK9pZ69Mo6GzrUXDsKaQ",
        "score": 0.047263775,
        "dist": 10928.135882,
        "info": "search:ta:840486000204573-US",
        "poi": {
          "name": "Highway 71 Food & Fuel",
          "phone": "+1 512-385-1053",
          "categorySet": [
            {
              "id": 9361009
            }
          ],
          "url": "highway-71-food-fuel.hub.biz",
          "categories": [
            "convenience stores",
            "shop"
          ],
          "classifications": [
            {
              "code": "SHOP",
              "names": [
                {
                  "nameLocale": "en-US",
                  "name": "shop"
                },
                {
                  "nameLocale": "en-US",
                  "name": "convenience stores"
                }
              ]
            }
          ]
        },
        "address": {
          "streetNumber": "2777",
          "streetName": "Highway 71 East",
          "municipality": "Austin",
          "countrySecondarySubdivision": "Travis",
          "countrySubdivision": "TX",
          "countrySubdivisionName": "Texas",
          "countrySubdivisionCode": "TX",
          "postalCode": "78617",
          "extendedPostalCode": "78617-2207",
          "countryCode": "US",
          "country": "United States",
          "countryCodeISO3": "USA",
          "freeformAddress": "2777 Highway 71 East, Del Valle, TX 78617",
          "localName": "Del Valle"
        },
        "position": {
          "lat": 30.210158,
          "lon": -97.652184
        },
        "viewport": {
          "topLeftPoint": {
            "lat": 30.21106,
            "lon": -97.65322
          },
          "btmRightPoint": {
            "lat": 30.20926,
            "lon": -97.65114
          }
        },
        "entryPoints": [
          {
            "type": "main",
            "position": {
              "lat": 30.20988,
              "lon": -97.65232
            }
          }
        ]
      },
      {
        "type": "POI",
        "id": "zr0d7R6ziqzsBxnzaJ6ZDg",
        "score": 0.0397152565,
        "dist": 6557.524598,
        "info": "search:ta:840489001290511-US",
        "poi": {
          "name": "Chaparral Stadium",
          "categorySet": [
            {
              "id": 7374006
            }
          ],
          "categories": [
            "multi-purpose",
            "stadium"
          ],
          "classifications": [
            {
              "code": "STADIUM",
              "names": [
                {
                  "nameLocale": "en-US",
                  "name": "stadium"
                },
                {
                  "nameLocale": "en-US",
                  "name": "multi-purpose"
                }
              ]
            }
          ]
        },
        "address": {
          "streetNumber": "4100",
          "streetName": "Westbank Drive",
          "municipality": "Austin",
          "countrySecondarySubdivision": "Travis",
          "countrySubdivision": "TX",
          "countrySubdivisionName": "Texas",
          "countrySubdivisionCode": "TX",
          "postalCode": "78746",
          "extendedPostalCode": "78746-6566",
          "countryCode": "US",
          "country": "United States",
          "countryCodeISO3": "USA",
          "freeformAddress": "4100 Westbank Drive, Austin, TX 78746",
          "localName": "Austin"
        },
        "position": {
          "lat": 30.277651,
          "lon": -97.813287
        },
        "viewport": {
          "topLeftPoint": {
            "lat": 30.27884,
            "lon": -97.81538
          },
          "btmRightPoint": {
            "lat": 30.27647,
            "lon": -97.81142
          }
        },
        "entryPoints": [
          {
            "type": "main",
            "position": {
              "lat": 30.27539,
              "lon": -97.81479
            }
          },
          {
            "type": "main",
            "position": {
              "lat": 30.27818,
              "lon": -97.81466
            }
          }
        ],
        "dataSources": {
          "geometry": {
            "id": "00005554-3400-3c00-0000-00005a995f9b"
          }
        }
      },
      {
        "type": "Cross Street",
        "id": "gudET997_pL9P4HlI6n6tg",
        "score": 0.0199879352,
        "dist": 8342.030763,
        "address": {
          "streetName": "Fort Collins Way & Colorado High Avenue",
          "municipality": "Austin",
          "neighbourhood": "Southeast",
          "countrySecondarySubdivision": "Travis",
          "countrySubdivision": "TX",
          "countrySubdivisionName": "Texas",
          "countrySubdivisionCode": "TX",
          "postalCode": "78744",
          "countryCode": "US",
          "country": "United States",
          "countryCodeISO3": "USA",
          "freeformAddress": "Fort Collins Way & Colorado High Avenue, Austin, TX 78744",
          "localName": "Austin"
        },
        "position": {
          "lat": 30.202819,
          "lon": -97.697981
        },
        "viewport": {
          "topLeftPoint": {
            "lat": 30.20372,
            "lon": -97.69902
          },
          "btmRightPoint": {
            "lat": 30.20192,
            "lon": -97.69694
          }
        }
      }
    ]
  }
}