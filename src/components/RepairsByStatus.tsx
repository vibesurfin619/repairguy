interface RepairsByStatusProps {
  sessionsByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export function RepairsByStatus({ sessionsByStatus }: RepairsByStatusProps) {
  const totalSessions = sessionsByStatus.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Repairs by Status</h2>
        <span className="text-sm text-gray-500">{totalSessions} total sessions</span>
      </div>
      
      {sessionsByStatus.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-gray-500">No repair sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionsByStatus
            .sort((a, b) => b.count - a.count)
            .map((item) => {
              const percentage = totalSessions > 0 ? (item.count / totalSessions) * 100 : 0;
              
              return (
                <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <div>
                      <span className="font-medium text-gray-700 capitalize">
                        {getStatusLabel(item.status)}
                      </span>
                      <p className="text-xs text-gray-500">
                        {percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-gray-800">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
      
      {sessionsByStatus.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Sessions</span>
            <span className="font-medium">{totalSessions}</span>
          </div>
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

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function getStatusLabel(status: string) {
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
}
