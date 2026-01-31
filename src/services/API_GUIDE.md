# ApiClient Usage Guide

## Table of Contents
1. [Basic Setup](#basic-setup)
2. [Language Configuration](#language-configuration)
3. [Cache Management](#cache-management)
4. [Request Cancellation](#request-cancellation)
5. [Error Handling](#error-handling)
6. [Common Use Cases](#common-use-cases)

---

## Basic Setup

```javascript
import apiClient from './ApiClient';

// The apiClient is a singleton and ready to use
// Default language is English
```

---

## Language Configuration

```javascript
// Change language to French
apiClient.setLanguage('fr');

// Change back to English
apiClient.setLanguage('en');

// Supported languages: 'en', 'fr'
```

---

## Cache Management

### Understanding Cache Behavior

The cache automatically stores responses for:
- Countries (5 minutes)
- Cities (5 minutes)
- Categories (5 minutes)
- Tags (5 minutes)
- Boarding options (5 minutes)
- Currencies (5 minutes)
- Hotel lists by city (5 minutes)
- Individual hotel details (5 minutes)

### Cache Operations

```javascript
// Get cache statistics
const stats = apiClient.getCacheStats();
console.log('Cache size:', stats.size);
console.log('Cached keys:', stats.keys);

// Clear all cache
apiClient.clearCache();

// Clear specific cache entry
apiClient.clearCacheEntry('countries');
apiClient.clearCacheEntry('hotels_city_123');
apiClient.clearCacheEntry('hotel_456');
```

### Cache Key Patterns

- Countries: `'countries'`
- Cities: `'cities'`
- Categories: `'categories'`
- Tags: `'tags'`
- Boarding: `'boarding'`
- Currencies: `'currencies'`
- All hotels: `'hotels_all'`
- Hotels by city: `'hotels_city_{cityId}'`
- Hotel detail: `'hotel_{hotelId}'`

---

## Request Cancellation

### Cancel Ongoing Search

```javascript
// Example: User starts a new search while old one is running
const performSearch = async (searchParams) => {
  try {
    // This automatically cancels any previous search
    const results = await apiClient.searchHotel(searchParams);
    console.log('Search results:', results);
  } catch (error) {
    if (error.isCancelled) {
      console.log('Search was cancelled');
      return;
    }
    console.error('Search error:', error);
  }
};

// First search
performSearch({
  checkIn: '2026-03-01',
  checkOut: '2026-03-05',
  hotels: [1, 2, 3, 4, 5],
  rooms: [{adult: 2}]
});

// Second search (cancels the first one automatically)
performSearch({
  checkIn: '2026-03-10',
  checkOut: '2026-03-15',
  hotels: [6, 7, 8, 9, 10],
  rooms: [{adult: 2}]
});
```

### Manual Cancellation

```javascript
// Cancel a specific request type
apiClient.cancelRequest('hotelSearch');

// Cancel all ongoing requests
apiClient.cancelAllRequests();
```

---

## Error Handling

### Error Types

```javascript
try {
  const results = await apiClient.searchHotel(searchParams);
} catch (error) {
  // Check error type
  if (error.isCancelled) {
    console.log('Request was cancelled');
  } else if (error.isTimeout) {
    console.log('Request timed out');
  } else if (error.isNetworkError) {
    console.log('Network error occurred');
  } else if (error.status === 401) {
    console.log('Unauthorized');
  } else if (error.status === 404) {
    console.log('Not found');
  } else if (error.status >= 500) {
    console.log('Server error');
  } else {
    console.log('Other error:', error.message);
  }
}
```

### Automatic Retry

The client automatically retries failed requests (up to 3 times) for:
- Network errors
- Timeout errors
- 5xx server errors
- 408 (Request Timeout) errors
- 429 (Too Many Requests) errors

**NOT retried:**
- Client errors (4xx except 408 and 429)
- Cancelled requests
- Successful requests

---

## Common Use Cases

### 1. Fetching Static Data (Countries, Cities, etc.)

```javascript
// These are automatically cached
const countries = await apiClient.listCountry();
const cities = await apiClient.listCity();
const categories = await apiClient.listCategorie();
const tags = await apiClient.listTag();
const boarding = await apiClient.listBoarding();
const currencies = await apiClient.listCurrency();

console.log('Countries:', countries);
console.log('Currencies:', currencies.currencies);
```

### 2. Fetching Hotels by City

```javascript
// Get all hotels
const allHotels = await apiClient.listHotel();

// Get hotels for specific city (cached)
const parisHotels = await apiClient.listHotel(123); // City ID 123

console.log('Hotels in Paris:', parisHotels);
```

### 3. Fetching Single Hotel Details

```javascript
try {
  const hotel = await apiClient.getHotel(456); // Hotel ID 456
  console.log('Hotel:', hotel);
} catch (error) {
  console.error('Failed to fetch hotel:', error.message);
}
```

### 4. Fetching Multiple Hotels in Batch

```javascript
const hotelIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const hotelsMap = await apiClient.getHotelsBatch(hotelIds, {
  batchSize: 5,
  delayBetweenBatches: 200
});

console.log('Fetched hotels:', Object.keys(hotelsMap).length);
console.log('Hotel 1:', hotelsMap[1]);
console.log('Hotel 2:', hotelsMap[2]);
```

### 5. Searching for Hotels with Availability

```javascript
const searchParams = {
  checkIn: '2026-03-15',
  checkOut: '2026-03-20',
  hotels: [1, 2, 3, 4, 5],
  rooms: [
    { adult: 2, child: [5, 8] }, // 2 adults, 2 children (ages 5 and 8)
    { adult: 2 }                  // 2 adults
  ],
  filters: {
    keywords: 'beach',
    category: [4, 5], // 4-5 star hotels
    onlyAvailable: true,
    tags: [1, 2, 3]
  }
};

try {
  const results = await apiClient.searchHotel(searchParams);
  
  console.log('Search results:', results.hotelSearch);
  console.log('Total results:', results.countResults);
  console.log('Search ID:', results.searchId);
  
  // Check if limit was applied
  if (results._limitApplied) {
    console.log(`Only searched ${results._searchedHotels} of ${results._requestedHotels} hotels`);
  }
} catch (error) {
  if (error.isCancelled) {
    console.log('Search was cancelled by user');
  } else {
    console.error('Search failed:', error.message);
  }
}
```

### 6. React Component Example - Search with Cancellation

```javascript
import { useState, useEffect } from 'react';
import apiClient from './ApiClient';

function HotelSearch() {
  const [searchParams, setSearchParams] = useState({
    checkIn: '2026-03-15',
    checkOut: '2026-03-20',
    hotels: [],
    rooms: [{ adult: 2 }]
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.searchHotel(searchParams);
      setResults(response.hotelSearch);
    } catch (err) {
      if (!err.isCancelled) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cancel search when component unmounts
  useEffect(() => {
    return () => {
      apiClient.cancelRequest('hotelSearch');
    };
  }, []);

  return (
    <div>
      <button onClick={performSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search Hotels'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      <div>
        {results.map(hotel => (
          <div key={hotel.Id}>{hotel.Name}</div>
        ))}
      </div>
    </div>
  );
}
```

### 7. React Component Example - Enhanced Hotel List with Progress

```javascript
import { useState } from 'react';
import apiClient from './ApiClient';

function EnhancedHotelList({ cityId }) {
  const [hotels, setHotels] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  const loadHotels = async () => {
    setLoading(true);
    setHotels([]);
    setProgress({ current: 0, total: 0 });

    try {
      const enhanced = await apiClient.listHotelEnhanced(cityId, {
        batchSize: 5,
        delayBetweenBatches: 100,
        onProgress: (current, total) => {
          setProgress({ current, total });
        },
        onBatchComplete: (batchNum, totalBatches, batchResults) => {
          // Update UI incrementally as each batch completes
          setHotels(prev => [...prev, ...batchResults]);
        }
      });
      
      console.log('All hotels loaded:', enhanced.length);
    } catch (error) {
      console.error('Failed to load hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={loadHotels} disabled={loading}>
        Load Enhanced Hotels
      </button>
      
      {loading && (
        <div>
          Loading: {progress.current} / {progress.total}
        </div>
      )}
      
      <div>
        {hotels.map(hotel => (
          <div key={hotel.Id}>
            <h3>{hotel.Name}</h3>
            <p>{hotel.Description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 8. Language Switching

```javascript
import { useState } from 'react';
import apiClient from './ApiClient';

function LanguageSwitcher() {
  const [language, setLanguage] = useState('en');

  const switchLanguage = (lang) => {
    apiClient.setLanguage(lang);
    setLanguage(lang);
  };

  const testError = async () => {
    try {
      // Trigger an error to see localized message
      await apiClient.getHotel(null);
    } catch (error) {
      alert(error.message); // Will show in selected language
    }
  };

  return (
    <div>
      <button onClick={() => switchLanguage('en')}>English</button>
      <button onClick={() => switchLanguage('fr')}>Français</button>
      <button onClick={testError}>Test Error Message</button>
    </div>
  );
}
```

### 9. Cache Management Example

```javascript
import { useEffect } from 'react';
import apiClient from './ApiClient';

function CacheManager() {
  const [stats, setStats] = useState({ size: 0, keys: [] });

  const refreshStats = () => {
    setStats(apiClient.getCacheStats());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div>
      <h2>Cache Manager</h2>
      <p>Cached items: {stats.size}</p>
      <ul>
        {stats.keys.map(key => (
          <li key={key}>
            {key}
            <button onClick={() => {
              apiClient.clearCacheEntry(key);
              refreshStats();
            }}>
              Clear
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => {
        apiClient.clearCache();
        refreshStats();
      }}>
        Clear All Cache
      </button>
    </div>
  );
}
```

### 10. Advanced Search with Debouncing

```javascript
import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from './ApiClient';

function DebouncedHotelSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  const performSearch = useCallback(async (term) => {
    if (!term) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const searchParams = {
        checkIn: '2026-03-15',
        checkOut: '2026-03-20',
        hotels: [1, 2, 3, 4, 5],
        rooms: [{ adult: 2 }],
        filters: {
          keywords: term,
          onlyAvailable: true
        }
      };

      const response = await apiClient.searchHotel(searchParams);
      setResults(response.hotelSearch);
    } catch (error) {
      if (!error.isCancelled) {
        console.error('Search error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      performSearch(searchTerm);
    }, 500); // 500ms debounce

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, performSearch]);

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search hotels..."
      />
      
      {loading && <div>Searching...</div>}
      
      <div>
        {results.map(hotel => (
          <div key={hotel.Id}>{hotel.Name}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## Configuration Options

You can modify the constants at the top of `ApiClient.js`:

```javascript
const CONFIG = {
    BASE_URL: 'https://admin.ipro-booking.com/api/hotel',
    TIMEOUT: {
        DEFAULT: 60000,      // Default timeout
        SEARCH: 120000,      // Search timeout
    },
    BATCH: {
        DEFAULT_SIZE: 5,     // Default batch size
        DEFAULT_DELAY: 100,  // Default delay between batches
    },
    LIMITS: {
        MAX_HOTELS_PER_SEARCH: 20,  // Max hotels per search
    },
    RETRY: {
        MAX_ATTEMPTS: 3,     // Max retry attempts
        BASE_DELAY: 1000,    // Base delay for retries
        MAX_DELAY: 5000,     // Max delay for retries
    },
    CACHE: {
        TTL: 5 * 60 * 1000, // Cache time-to-live (5 minutes)
        ENABLED: true,       // Enable/disable caching
    }
};
```

---

## Performance Tips

1. **Use Cache Wisely**: For static data like countries, cities, categories - rely on cache
2. **Batch Requests**: Use `getHotelsBatch()` instead of multiple individual requests
3. **Cancel Old Searches**: Let the automatic cancellation handle user interactions
4. **Adjust Batch Size**: Smaller batches = more frequent updates, larger batches = faster overall
5. **Clear Cache When Needed**: Clear cache after data updates on the server
6. **Monitor Cache Size**: Use `getCacheStats()` to track cache growth

---

## Troubleshooting

### Search Timeouts
- Reduce number of hotels in search (current limit: 20)
- Check network connection
- Increase `CONFIG.TIMEOUT.SEARCH` if needed

### Cache Issues
- Clear cache with `apiClient.clearCache()`
- Disable cache temporarily: `CONFIG.CACHE.ENABLED = false`

### Request Cancellation Not Working
- Ensure you're catching `isCancelled` errors
- Check that you're not creating multiple instances of ApiClient

---

## Best Practices

1. **Always handle errors properly**
2. **Use cache for frequently accessed data**
3. **Cancel requests on component unmount**
4. **Implement loading states in UI**
5. **Show progress for batch operations**
6. **Use appropriate language for your users**
7. **Monitor cache statistics in development**
8. **Test with slow network conditions**
