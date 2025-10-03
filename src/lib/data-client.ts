/**
 * Client-side data access utilities for RepairGuy
 * Provides easy access to protected database APIs for authenticated users
 */

'use client';

import { useAuth } from '@clerk/nextjs';

// Base API URL
const API_BASE = '/api/data';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
  authenticatedUser?: string;
}


export interface Item {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  category?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  category?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}


/**
 * Custom hook for making authenticated API requests
 */
export function useDataApi() {
  const { getToken } = useAuth();

  const makeRequest = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const token = await getToken();
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };


  // Items API
  const items = {
    // Get all items
    getAll: () => makeRequest<Item[]>('/items'),
    
    // Create new item
    create: (item: Partial<Item>) =>
      makeRequest<Item>('/items', {
        method: 'POST',
        body: JSON.stringify(item),
      }),
  };

  // Workflows API  
  const workflows = {
    // Get all workflow definitions
    getAll: () => makeRequest<WorkflowDefinition[]>('/workflows'),
    
    // Create new workflow definition
    create: (workflow: Partial<WorkflowDefinition>) =>
      makeRequest<WorkflowDefinition>('/workflows', {
        method: 'POST',
        body: JSON.stringify(workflow),
      }),
  };

  // Custom query API
  const query = {
    // Execute custom SELECT query
    execute: (sql: string, params: any[] = []) =>
      makeRequest('/query', {
        method: 'POST',
        body: JSON.stringify({ query: sql, params }),
      }),
    
    // Get database schema
    getSchema: () => makeRequest('/query'),
  };

  return {
    items,
    workflows,
    query,
    makeRequest, // For custom endpoints
  };
}

/**
 * React hook for fetching data with loading states
 */
export function useDataFetch<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetcher();
        
        if (mounted) {
          if (response.success && response.data) {
            setData(response.data);
          } else {
            setError(response.error || 'Failed to fetch data');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, loading, error, refetch: () => setLoading(true) };
}

// Import React for the useDataFetch hook
import React from 'react';
