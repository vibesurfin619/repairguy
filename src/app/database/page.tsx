'use client';

import { AuthGuard } from '@/lib/auth-client';
import { useDataApi, useDataFetch } from '@/lib/data-client';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

export default function DatabasePage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Database Access Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Welcome to your database dashboard. As an authenticated user, you have access to all database data.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UserInfo />
          <RepairSessionsList />
          <ItemsList />
          <WorkflowsList />
          <DatabaseSchema />
          <CustomQuery />
        </div>
      </div>
    </AuthGuard>
  );
}

function UserInfo() {
  const { user } = useUser();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">User Information</h2>
      <div className="space-y-2">
        <p><strong>Name:</strong> {user?.fullName || 'N/A'}</p>
        <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'N/A'}</p>
        <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
        <p><strong>Authentication:</strong> ✅ Authenticated with Clerk</p>
        <p><strong>Database Access:</strong> ✅ Full access granted</p>
      </div>
    </div>
  );
}

function RepairSessionsList() {
  const dataApi = useDataApi();
  const { data: sessions, loading, error } = useDataFetch(
    () => dataApi.repairSessions.getAll(),
    []
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Repair Sessions</h2>
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {sessions && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Total sessions: {sessions.length}</p>
          <div className="max-h-48 overflow-y-auto">
            {sessions.map((session: any) => (
              <div key={session.id} className="border-b py-2 last:border-b-0">
                <p className="font-medium">Session {session.id}</p>
                <p className="text-sm text-gray-600">Status: {session.status}</p>
                <p className="text-sm text-gray-600">Item: {session.item_id}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemsList() {
  const dataApi = useDataApi();
  const { data: items, loading, error } = useDataFetch(
    () => dataApi.items.getAll(),
    []
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Items</h2>
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {items && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Total items: {items.length}</p>
          <div className="max-h-48 overflow-y-auto">
            {items.map((item: any) => (
              <div key={item.id} className="border-b py-2 last:border-b-0">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">{item.brand} {item.model}</p>
                <p className="text-sm text-gray-600">Category: {item.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowsList() {
  const dataApi = useDataApi();
  const { data: workflows, loading, error } = useDataFetch(
    () => dataApi.workflows.getAll(),
    []
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Workflow Definitions</h2>
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {workflows && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Total workflows: {workflows.length}</p>
          <div className="max-h-48 overflow-y-auto">
            {workflows.map((workflow: any) => (
              <div key={workflow.id} className="border-b py-2 last:border-b-0">
                <p className="font-medium">{workflow.name}</p>
                <p className="text-sm text-gray-600">{workflow.description}</p>
                <p className="text-sm text-gray-600">Category: {workflow.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DatabaseSchema() {
  const dataApi = useDataApi();
  const { data: schema, loading, error } = useDataFetch(
    () => dataApi.query.getSchema(),
    []
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Database Schema</h2>
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {schema && (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Tables: {Object.keys(schema.schema).length}
          </p>
          <div className="max-h-48 overflow-y-auto">
            {Object.entries(schema.schema).map(([tableName, columns]: [string, any]) => (
              <div key={tableName} className="border-b py-2 last:border-b-0">
                <p className="font-medium">{tableName}</p>
                <p className="text-sm text-gray-600">
                  {columns.length} columns
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomQuery() {
  const dataApi = useDataApi();
  const [query, setQuery] = useState('SELECT COUNT(*) as total FROM repair_sessions');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await dataApi.query.execute(query);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Query failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
      <h2 className="text-xl font-semibold mb-4">Custom Query</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SQL Query (SELECT only)
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={3}
            placeholder="Enter your SELECT query here..."
          />
        </div>
        
        <button
          onClick={executeQuery}
          disabled={loading || !query.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Executing...' : 'Execute Query'}
        </button>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}
        
        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Query Result:</p>
            <pre className="text-sm text-gray-800 overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
