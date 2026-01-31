# React Query Hooks Usage Guide

## Table of Contents
1. [Setup](#setup)
2. [Basic Queries](#basic-queries)
3. [Hotel Queries](#hotel-queries)
4. [Search Functionality](#search-functionality)
5. [Helper Hooks](#helper-hooks)
6. [Cache Management](#cache-management)
7. [Advanced Patterns](#advanced-patterns)
8. [Best Practices](#best-practices)

---

## Setup

### 1. Install Dependencies

```bash
npm install @tanstack/react-query
# or
yarn add @tanstack/react-query
```

### 2. Configure React Query Provider

```javascript
// App.jsx or main.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      staleTime: 1000 * 60 * 5, // 5 minutes default
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      {/* Add devtools for development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Basic Queries

### Fetching Countries

```javascript
import { useCountries } from './hooks/useHotelQueries';

function CountrySelector() {
  const { data: countries, isLoading, error } = useCountries();

  if (isLoading) return <div>Loading countries...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <select>
      {countries?.map(country => (
        <option key={country.Id} value={country.Id}>
          {country.Name}
        </option>
      ))}
    </select>
  );
}
```

### Fetching Cities

```javascript
import { useCities } from './hooks/useHotelQueries';

function CitySelector() {
  const { data: cities, isLoading, error } = useCities();

  if (isLoading) return <div>Loading cities...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <select>
      {cities?.map(city => (
        <option key={city.Id} value={city.Id}>
          {city.Name}
        </option>
      ))}
    </select>
  );
}
```

### Fetching All Filter Data at Once

```javascript
import { useFilterData } from './hooks/useHotelQueries';

function FilterPanel() {
  const {
    countries,
    cities,
    categories,
    tags,
    boardings,
    currencies,
    isLoading,
    isError,
    error
  } = useFilterData();

  if (isLoading) return <div>Loading filters...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div>
      <h2>Filters</h2>
      
      {/* Countries */}
      <div>
        <label>Country</label>
        <select>
          {countries.data?.map(country => (
            <option key={country.Id} value={country.Id}>
              {country.Name}
            </option>
          ))}
        </select>
      </div>

      {/* Cities */}
      <div>
        <label>City</label>
        <select>
          {cities.data?.map(city => (
            <option key={city.Id} value={city.Id}>
              {city.Name}
            </option>
          ))}
        </select>
      </div>

      {/* Categories (Star ratings) */}
      <div>
        <label>Category</label>
        <select>
          {categories.data?.map(category => (
            <option key={category.Id} value={category.Id}>
              {category.Title} - {category.Star} stars
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label>Tags</label>
        {tags.data?.map(tag => (
          <label key={tag.Id}>
            <input type="checkbox" value={tag.Id} />
            {tag.Title}
          </label>
        ))}
      </div>
    </div>
  );
}
```

---

## Hotel Queries

### Fetching All Hotels

```javascript
import { useHotels } from './hooks/useHotelQueries';

function HotelList() {
  const { data: hotels, isLoading, error } = useHotels();

  if (isLoading) return <div>Loading hotels...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>All Hotels ({hotels?.length})</h2>
      {hotels?.map(hotel => (
        <div key={hotel.Id}>
          <h3>{hotel.Name}</h3>
          <p>{hotel.City?.Name}, {hotel.City?.Country?.Name}</p>
          <p>Category: {hotel.Category?.Star} stars</p>
        </div>
      ))}
    </div>
  );
}
```

### Fetching Hotels by City

```javascript
import { useState } from 'react';
import { useHotels } from './hooks/useHotelQueries';

function HotelsByCity() {
  const [selectedCity, setSelectedCity] = useState(null);

  const { 
    data: hotels, 
    isLoading, 
    error 
  } = useHotels(selectedCity, {
    enabled: !!selectedCity, // Only fetch when city is selected
  });

  return (
    <div>
      <select onChange={(e) => setSelectedCity(e.target.value || null)}>
        <option value="">Select a city</option>
        <option value="1">Paris</option>
        <option value="2">London</option>
        <option value="3">New York</option>
      </select>

      {isLoading && <div>Loading hotels...</div>}
      {error && <div>Error: {error.message}</div>}
      
      {hotels && (
        <div>
          <h2>Hotels in {selectedCity} ({hotels.length})</h2>
          {hotels.map(hotel => (
            <div key={hotel.Id}>{hotel.Name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Fetching Single Hotel Detail

```javascript
import { useParams } from 'react-router-dom';
import { useHotelDetail } from './hooks/useHotelQueries';

function HotelDetailPage() {
  const { hotelId } = useParams();
  const { data: hotel, isLoading, error } = useHotelDetail(hotelId);

  if (isLoading) return <div>Loading hotel details...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!hotel) return <div>Hotel not found</div>;

  return (
    <div>
      <h1>{hotel.Name}</h1>
      <p>{hotel.Description}</p>
      <p>Address: {hotel.Address}</p>
      <p>Phone: {hotel.Phone}</p>
      <p>Email: {hotel.Email}</p>
      
      {/* Images */}
      <div>
        {hotel.Album?.map((image, index) => (
          <img key={index} src={image} alt={hotel.Name} />
        ))}
      </div>

      {/* Facilities */}
      <div>
        <h3>Facilities</h3>
        <ul>
          {hotel.Facilities?.map((facility, index) => (
            <li key={index}>{facility}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### Fetching Multiple Hotels in Batch

```javascript
import { useHotelsBatch } from './hooks/useHotelQueries';

function FavoriteHotels() {
  const favoriteIds = [1, 2, 3, 4, 5];

  const { 
    data: hotelsMap, 
    isLoading, 
    error 
  } = useHotelsBatch(favoriteIds, {
    batchSize: 5,
    delayBetweenBatches: 200,
  });

  if (isLoading) return <div>Loading favorite hotels...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Favorite Hotels</h2>
      {favoriteIds.map(id => {
        const hotel = hotelsMap?.[id];
        if (!hotel) return null;
        
        return (
          <div key={id}>
            <h3>{hotel.Name}</h3>
            <p>{hotel.Description}</p>
          </div>
        );
      })}
    </div>
  );
}
```

### Fetching Enhanced Hotels with Progress

```javascript
import { useState } from 'react';
import { useHotelsEnhanced } from './hooks/useHotelQueries';

function EnhancedHotelList() {
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { 
    data: hotels, 
    isLoading, 
    error 
  } = useHotelsEnhanced(null, {
    batchSize: 5,
    delayBetweenBatches: 100,
    onProgress: (current, total) => {
      setProgress({ current, total });
    },
  });

  return (
    <div>
      <h2>Enhanced Hotels</h2>
      
      {isLoading && (
        <div>
          Loading enhanced hotels... 
          {progress.total > 0 && (
            <span>({progress.current}/{progress.total})</span>
          )}
        </div>
      )}

      {error && <div>Error: {error.message}</div>}

      {hotels && (
        <div>
          <p>Loaded {hotels.length} enhanced hotels</p>
          {hotels.map(hotel => (
            <div key={hotel.Id}>
              <h3>{hotel.Name}</h3>
              <p>{hotel.Description}</p>
              <p>Enhanced: {hotel._enhanced ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Search Functionality

### Basic Hotel Search (useQuery approach)

```javascript
import { useState } from 'react';
import { useHotelSearch } from './hooks/useHotelQueries';

function HotelSearch() {
  const [searchParams, setSearchParams] = useState({
    checkIn: '2026-03-15',
    checkOut: '2026-03-20',
    hotels: [1, 2, 3, 4, 5],
    rooms: [{ adult: 2 }],
    filters: {
      keywords: '',
      onlyAvailable: true,
    }
  });
  const [enabled, setEnabled] = useState(false);

  const { data, isLoading, error, refetch } = useHotelSearch(searchParams, {
    enabled: enabled,
  });

  const handleSearch = () => {
    setEnabled(true);
  };

  return (
    <div>
      <h2>Hotel Search</h2>

      <input
        type="date"
        value={searchParams.checkIn}
        onChange={(e) => setSearchParams(prev => ({
          ...prev,
          checkIn: e.target.value
        }))}
      />

      <input
        type="date"
        value={searchParams.checkOut}
        onChange={(e) => setSearchParams(prev => ({
          ...prev,
          checkOut: e.target.value
        }))}
      />

      <button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search Hotels'}
      </button>

      {error && <div className="error">{error.message}</div>}

      {data && (
        <div>
          <h3>Search Results ({data.hotelSearch.length})</h3>
          {data._limitApplied && (
            <p className="warning">
              Only showing {data._searchedHotels} of {data._requestedHotels} hotels
            </p>
          )}
          
          {data.hotelSearch.map(hotel => (
            <div key={hotel.Id}>
              <h4>{hotel.Name}</h4>
              {/* Display hotel search results */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Hotel Search with Mutation (Better for on-demand searches)

```javascript
import { useState } from 'react';
import { useHotelSearchMutation } from './hooks/useHotelQueries';

function HotelSearchMutation() {
  const [searchParams, setSearchParams] = useState({
    checkIn: '2026-03-15',
    checkOut: '2026-03-20',
    hotels: [1, 2, 3, 4, 5],
    rooms: [{ adult: 2 }],
  });

  const { 
    mutate: searchHotels, 
    data, 
    isLoading, 
    error 
  } = useHotelSearchMutation({
    onSuccess: (data) => {
      console.log('Search completed:', data);
    },
    onError: (error) => {
      console.error('Search failed:', error);
    },
  });

  const handleSearch = () => {
    searchHotels(searchParams);
  };

  return (
    <div>
      <h2>Hotel Search (Mutation)</h2>

      {/* Search form inputs */}
      <div>
        <label>Check-in:</label>
        <input
          type="date"
          value={searchParams.checkIn}
          onChange={(e) => setSearchParams(prev => ({
            ...prev,
            checkIn: e.target.value
          }))}
        />
      </div>

      <div>
        <label>Check-out:</label>
        <input
          type="date"
          value={searchParams.checkOut}
          onChange={(e) => setSearchParams(prev => ({
            ...prev,
            checkOut: e.target.value
          }))}
        />
      </div>

      <button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search Hotels'}
      </button>

      {error && (
        <div className="error">
          {error.isCancelled 
            ? 'Search was cancelled' 
            : error.message
          }
        </div>
      )}

      {data && (
        <div>
          <h3>Results: {data.hotelSearch.length} hotels</h3>
          {data.hotelSearch.map(hotel => (
            <div key={hotel.Id}>{hotel.Name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Debounced Search (Search-as-you-type)

```javascript
import { useState } from 'react';
import { useDebouncedHotelSearch } from './hooks/useHotelQueries';

function DebouncedSearch() {
  const [searchParams, setSearchParams] = useState({
    checkIn: '2026-03-15',
    checkOut: '2026-03-20',
    hotels: [1, 2, 3, 4, 5],
    rooms: [{ adult: 2 }],
    filters: { keywords: '' }
  });

  // Automatically searches after 500ms of no typing
  const { data, isLoading, error } = useDebouncedHotelSearch(searchParams, 500);

  return (
    <div>
      <h2>Search as you type</h2>

      <input
        type="text"
        placeholder="Search keywords..."
        value={searchParams.filters.keywords}
        onChange={(e) => setSearchParams(prev => ({
          ...prev,
          filters: { ...prev.filters, keywords: e.target.value }
        }))}
      />

      {isLoading && <div>Searching...</div>}
      {error && <div>Error: {error.message}</div>}

      {data && (
        <div>
          <p>Found {data.hotelSearch.length} hotels</p>
          {data.hotelSearch.map(hotel => (
            <div key={hotel.Id}>{hotel.Name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Helper Hooks

### Prefetching Filter Data

```javascript
import { usePrefetchFilterData } from './hooks/useHotelQueries';

function AppLayout({ children }) {
  // Prefetch all filter data when app loads
  usePrefetchFilterData();

  return (
    <div>
      <header>My Travel App</header>
      <main>{children}</main>
    </div>
  );
}
```

### Setting Language

```javascript
import { useState } from 'react';
import { useApiClientLanguage } from './hooks/useHotelQueries';

function LanguageSwitcher() {
  const [language, setLanguage] = useState('en');
  
  // Automatically updates ApiClient language
  useApiClientLanguage(language);

  return (
    <div>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('fr')}>Français</button>
      <p>Current language: {language}</p>
    </div>
  );
}
```

### Invalidating Queries After Updates

```javascript
import { useInvalidateHotels } from './hooks/useHotelQueries';

function HotelBooking() {
  const invalidate = useInvalidateHotels();

  const handleBooking = async (hotelId) => {
    try {
      // Make booking API call
      await makeBooking(hotelId);
      
      // Refresh hotel data
      invalidate.invalidateDetail(hotelId);
      invalidate.invalidateSearch();
      
      alert('Booking successful!');
    } catch (error) {
      alert('Booking failed: ' + error.message);
    }
  };

  return (
    <div>
      <button onClick={() => handleBooking(123)}>
        Book Hotel
      </button>
    </div>
  );
}
```

---

## Cache Management

### Cache Manager Component

```javascript
import { useCacheManager } from './hooks/useHotelQueries';

function CacheDebugPanel() {
  const cache = useCacheManager();
  const [stats, setStats] = React.useState(null);

  const refreshStats = () => {
    setStats(cache.getStats());
  };

  React.useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div className="cache-debug">
      <h2>Cache Statistics</h2>

      <div>
        <h3>ApiClient Cache</h3>
        <p>Size: {stats?.apiClient.size}</p>
        <p>Keys: {stats?.apiClient.keys.join(', ')}</p>
      </div>

      <div>
        <h3>React Query Cache</h3>
        <p>Total Queries: {stats?.reactQuery.totalQueries}</p>
        <p>Active: {stats?.reactQuery.activeQueries}</p>
        <p>Stale: {stats?.reactQuery.staleQueries}</p>
      </div>

      <div>
        <button onClick={refreshStats}>Refresh Stats</button>
        <button onClick={cache.clearApiClientCache}>
          Clear ApiClient Cache
        </button>
        <button onClick={cache.clearReactQueryCache}>
          Clear React Query Cache
        </button>
        <button onClick={cache.clearAll}>
          Clear All Caches
        </button>
      </div>
    </div>
  );
}
```

---

## Advanced Patterns

### Optimistic Updates

```javascript
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './hooks/useHotelQueries';

function OptimisticBooking() {
  const queryClient = useQueryClient();

  const handleFavorite = async (hotelId) => {
    // Optimistically update the UI
    queryClient.setQueryData(
      QUERY_KEYS.hotelDetail(hotelId),
      (old) => ({ ...old, isFavorite: true })
    );

    try {
      // Make API call
      await addToFavorites(hotelId);
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(
        QUERY_KEYS.hotelDetail(hotelId),
        (old) => ({ ...old, isFavorite: false })
      );
    }
  };

  return <button onClick={() => handleFavorite(123)}>Add to Favorites</button>;
}
```

### Dependent Queries

```javascript
import { useHotels, useHotelDetail } from './hooks/useHotelQueries';

function DependentQueriesExample() {
  // First, get the list of hotels
  const { data: hotels } = useHotels();

  // Then, get details for the first hotel (only when hotels are loaded)
  const firstHotelId = hotels?.[0]?.Id;
  const { data: hotelDetail } = useHotelDetail(firstHotelId, {
    enabled: !!firstHotelId, // Only fetch when we have an ID
  });

  return (
    <div>
      <h2>First Hotel Details</h2>
      {hotelDetail && (
        <div>
          <h3>{hotelDetail.Name}</h3>
          <p>{hotelDetail.Description}</p>
        </div>
      )}
    </div>
  );
}
```

### Parallel Queries

```javascript
import { useHotels, useCategories, useTags } from './hooks/useHotelQueries';

function ParallelQueriesExample() {
  // All queries run in parallel
  const hotelsQuery = useHotels();
  const categoriesQuery = useCategories();
  const tagsQuery = useTags();

  const isLoading = hotelsQuery.isLoading || 
                    categoriesQuery.isLoading || 
                    tagsQuery.isLoading;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Hotels: {hotelsQuery.data?.length}</h2>
      <h2>Categories: {categoriesQuery.data?.length}</h2>
      <h2>Tags: {tagsQuery.data?.length}</h2>
    </div>
  );
}
```

### Infinite Scroll

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';
import ApiClient from './services/ApiClient';

function InfiniteHotels() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['hotels', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const hotels = await ApiClient.listHotel();
      const start = pageParam * 10;
      const end = start + 10;
      return {
        hotels: hotels.slice(start, end),
        nextPage: end < hotels.length ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.hotels.map(hotel => (
            <div key={hotel.Id}>{hotel.Name}</div>
          ))}
        </div>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. Always Handle Loading and Error States

```javascript
function GoodExample() {
  const { data, isLoading, error } = useHotels();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <NoData />;

  return <HotelList hotels={data} />;
}
```

### 2. Use Enabled Option for Conditional Queries

```javascript
function ConditionalQuery({ hotelId }) {
  const { data } = useHotelDetail(hotelId, {
    enabled: !!hotelId, // Only fetch if hotelId exists
  });

  return data ? <HotelDetails hotel={data} /> : null;
}
```

### 3. Prefetch for Better UX

```javascript
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './hooks/useHotelQueries';

function HotelCard({ hotel }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // Prefetch hotel details on hover
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.hotelDetail(hotel.Id),
      queryFn: () => ApiClient.getHotelDetail(hotel.Id),
    });
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      <h3>{hotel.Name}</h3>
    </div>
  );
}
```

### 4. Clear Cache When Necessary

```javascript
function AdminPanel() {
  const invalidate = useInvalidateHotels();

  const handleDataUpdate = () => {
    // After updating hotel data on server
    invalidate.invalidateAll();
  };

  return <button onClick={handleDataUpdate}>Refresh All Data</button>;
}
```

### 5. Use Mutations for Write Operations

```javascript
const updateHotelMutation = useMutation({
  mutationFn: (hotelData) => updateHotel(hotelData),
  onSuccess: (data, variables) => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.hotelDetail(variables.id) 
    });
  },
});
```

---

## Performance Tips

1. **Use staleTime wisely** - Set longer staleTime for static data
2. **Enable gcTime** - Keep cached data around longer
3. **Prefetch anticipated data** - Prefetch on hover or route change
4. **Use pagination** - Don't load all data at once
5. **Leverage both caches** - ApiClient cache + React Query cache = double caching
6. **Cancel unnecessary requests** - Automatic with our implementation
7. **Monitor with DevTools** - Use React Query DevTools in development

---

## Troubleshooting

### Query Not Updating
- Check if `enabled` option is set to `false`
- Verify `staleTime` - data might still be fresh
- Check if `refetchOnMount` or `refetchOnWindowFocus` are disabled

### Too Many Requests
- Increase `staleTime` for less frequent refetching
- Use `enabled: false` for conditional queries
- Check if you're creating new query keys unnecessarily

### Data Not Caching
- Verify query keys are consistent
- Check `gcTime` setting
- Ensure queries aren't disabled

---

This guide covers the most common use cases. For more advanced scenarios, refer to the [TanStack Query documentation](https://tanstack.com/query/latest).
