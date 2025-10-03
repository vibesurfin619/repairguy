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

export interface RepairSession {
  id: string;
  user_id: string;
  item_id: string;
  workflow_definition_id: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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

export interface WorkflowQuestion {
  id: string;
  workflow_definition_id: string;
  question_text: string;
  question_type: string;
  options?: any;
  step_order: number;
  is_required: boolean;
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

  // Repair Sessions API
  const repairSessions = {
    // Get all repair sessions
    getAll: () => makeRequest<RepairSession[]>('/repair-sessions'),
    
    // Get specific repair session
    getById: (id: string) => makeRequest<RepairSession>(`/repair-sessions/${id}`),
    
    // Create new repair session
    create: (session: Partial<RepairSession>) =>
      makeRequest<RepairSession>('/repair-sessions', {
        method: 'POST',
        body: JSON.stringify(session),
      }),
    
    // Update repair session
    update: (id: string, updates: Partial<RepairSession>) =>
      makeRequest<RepairSession>(`/repair-sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    
    // Delete repair session
    delete: (id: string) =>
      makeRequest(`/repair-sessions/${id}`, {
        method: 'DELETE',
      }),
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
    
    // Get questions for a workflow
    getQuestions: (workflowId: string) =>
      makeRequest<WorkflowQuestion[]>(`/workflows/${workflowId}/questions`),
    
    // Create new workflow question
    createQuestion: (workflowId: string, question: Partial<WorkflowQuestion>) =>
      makeRequest<WorkflowQuestion>(`/workflows/${workflowId}/questions`, {
        method: 'POST',
        body: JSON.stringify(question),
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
    repairSessions,
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
