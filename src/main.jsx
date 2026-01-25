import {StrictMode} from 'react'

import {BrowserRouter} from "react-router-dom";
import {createRoot} from 'react-dom/client'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

import App from './App.jsx'

import './index.css'

// Create a QueryClient instance
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime in v4)
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <App/>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </BrowserRouter>
    </StrictMode>,
)
