import {StrictMode} from 'react'
import {BrowserRouter} from "react-router-dom";
import {createRoot} from 'react-dom/client'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

import App from './App.jsx'
import './index.css'

// Create a QueryClient instance with React 19 optimizations
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
            // ✅ React 19 optimizations
            experimental_prefetchInRender: true,
        },
        mutations: {
            retry: 1,
            // ✅ React 19: Use optimistic updates by default
            onMutate: async () => {
                // Will be overridden by individual mutations
            },
        },
    },
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <App/>
                {/* ✅ Only load devtools in development */}
                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </BrowserRouter>
    </StrictMode>,
)
