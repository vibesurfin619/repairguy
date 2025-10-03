'use client';

import { AuthGuard } from '@/lib/auth-client';
import { useDataApi, useDataFetch, RepairSession } from '@/lib/data-client';
import { useMemo } from 'react';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Repair Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Overview of all repair sessions and their current status.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <RepairStats />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentRepairs />
          <RepairsByStatus />
        </div>
      </div>
    </AuthGuard>
  );
}

function RepairStats() {
  const dataApi = useDataApi();
  const { data: sessions, loading, error } = useDataFetch(
    () => dataApi.repairSessions.getAll(),
    []
  );

  const stats = useMemo(() => {
    if (!sessions) return { completed: 0, inProgress: 0, outstanding: 0 };
    
    const completed = sessions.filter((session: RepairSession) => 
      session.status === 'completed' || session.status === 'finished'
    ).length;
    
    const inProgress = sessions.filter((session: RepairSession) => 
      session.status === 'started' || session.status === 'in_progress' || session.status === 'active'
    ).length;
    
    const outstanding = sessions.filter((session: RepairSession) => 
      session.status === 'pending' || session.status === 'waiting' || session.status === 'scheduled'
    ).length;
    
    return { completed, inProgress, outstanding };
  }, [sessions]);

  if (loading) {
    return (
      <>
        <StatCard title="Repairs Completed" value="..." color="green" loading />
        <StatCard title="Repairs in Progress" value="..." color="blue" loading />
        <StatCard title="Repairs Outstanding" value="..." color="orange" loading />
      </>
    );
  }

  if (error) {
    return (
      <div className="col-span-3 bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading repair statistics: {error}</p>
      </div>
    );
  }

  return (
    <>
      <StatCard 
        title="Repairs Completed" 
        value={stats.completed} 
        color="green" 
        description="Successfully finished repairs"
      />
      <StatCard 
        title="Repairs in Progress" 
        value={stats.inProgress} 
        color="blue" 
        description="Currently being worked on"
      />
      <StatCard 
        title="Repairs Outstanding" 
        value={stats.outstanding} 
        color="orange" 
        description="Waiting to be started"
      />
    </>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  color: 'green' | 'blue' | 'orange';
  description?: string;
  loading?: boolean;
}

function StatCard({ title, value, color, description, loading = false }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800'
  };

  const iconClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${loading ? 'animate-pulse' : ''}`}>
            {value}
          </p>
          {description && (
            <p className="text-sm opacity-75 mt-1">{description}</p>
          )}
        </div>
        <div className={`${iconClasses[color]} opacity-75`}>
          {color === 'green' && (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {color === 'blue' && (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
          {color === 'orange' && (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentRepairs() {
  const dataApi = useDataApi();
  const { data: sessions, loading, error } = useDataFetch(
    () => dataApi.repairSessions.getAll(),
    []
  );

  const recentSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .sort((a: RepairSession, b: RepairSession) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [sessions]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Repairs</h2>
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
      {recentSessions && (
        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No repair sessions found</p>
          ) : (
            recentSessions.map((session: RepairSession) => (
              <div key={session.id} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">Session #{session.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">Item: {session.item_id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RepairsByStatus() {
  const dataApi = useDataApi();
  const { data: sessions, loading, error } = useDataFetch(
    () => dataApi.repairSessions.getAll(),
    []
  );

  const statusGroups = useMemo(() => {
    if (!sessions) return {};
    
    return sessions.reduce((acc: Record<string, RepairSession[]>, session: RepairSession) => {
      const status = session.status || 'unknown';
      if (!acc[status]) acc[status] = [];
      acc[status].push(session);
      return acc;
    }, {});
  }, [sessions]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Repairs by Status</h2>
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
      {statusGroups && (
        <div className="space-y-3">
          {Object.keys(statusGroups).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No repair sessions found</p>
          ) : (
            Object.entries(statusGroups).map(([status, sessionsInStatus]) => (
              <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <span className="font-medium text-gray-700 capitalize">{status}</span>
                </div>
                <span className="text-lg font-semibold text-gray-800">
                  {sessionsInStatus.length}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('completed') || normalizedStatus.includes('finished')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (normalizedStatus.includes('started') || normalizedStatus.includes('progress') || normalizedStatus.includes('active')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (normalizedStatus.includes('pending') || normalizedStatus.includes('waiting') || normalizedStatus.includes('scheduled')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}
