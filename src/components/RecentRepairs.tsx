interface RecentRepairsProps {
  sessions: Array<{
    id: string;
    status: string;
    startedAt: string;
    itemId: string;
    technicianId: string;
    itemLp: string | null;
    technicianName: string | null;
  }>;
}

export function RecentRepairs({ sessions }: RecentRepairsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Recent Repair Sessions</h2>
        <span className="text-sm text-gray-500">{sessions.length} sessions</span>
      </div>
      
      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-2 text-gray-500">No repair sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="border-b pb-3 last:border-b-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-800">
                      Session #{session.id.slice(0, 8)}
                    </p>
                    <StatusBadge status={session.status} />
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {session.itemLp && (
                      <p>Item: <span className="font-medium">{session.itemLp}</span></p>
                    )}
                    {session.technicianName && (
                      <p>Technician: <span className="font-medium">{session.technicianName}</span></p>
                    )}
                    <p className="text-gray-500">
                      Started: {new Date(session.startedAt).toLocaleDateString()} at {new Date(session.startedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {sessions.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <a 
            href="/dashboard/repair-sessions" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all repair sessions →
          </a>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'abandoned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'in_progress':
        return 'In Progress';
      case 'submitted':
        return 'Submitted';
      case 'abandoned':
        return 'Abandoned';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}
