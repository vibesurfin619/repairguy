interface OutstandingRepairsTileProps {
  repairs: Array<{
    id: string;
    repairType: string;
    status: string;
    priority: number;
    description: string | null;
    estimatedCost: number | null;
    createdAt: string;
    itemLp: string | null;
    technicianName: string | null;
  }>;
}

export function OutstandingRepairsTile({ repairs }: OutstandingRepairsTileProps) {
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4:
        return 'text-red-600 bg-red-50 border-red-200';
      case 3:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 2:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 4:
        return 'Urgent';
      case 3:
        return 'High';
      case 2:
        return 'Medium';
      default:
        return 'Low';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Outstanding Repairs</h2>
        <span className="text-sm text-gray-500">{repairs.length} repairs</span>
      </div>
      
      {repairs.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-gray-500">No outstanding repairs</p>
        </div>
      ) : (
        <div className="space-y-3">
          {repairs.slice(0, 5).map((repair) => (
            <div key={repair.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(repair.priority)}`}>
                    {getPriorityLabel(repair.priority)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(repair.status)}`}>
                    {repair.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="font-medium text-gray-800 capitalize">
                  {repair.repairType.replace(/_/g, ' ').toLowerCase()}
                </p>
                
                {repair.itemLp && (
                  <p className="text-sm text-gray-600">
                    Item: <span className="font-medium">{repair.itemLp}</span>
                  </p>
                )}
                
                {repair.technicianName && (
                  <p className="text-sm text-gray-600">
                    Assigned to: <span className="font-medium">{repair.technicianName}</span>
                  </p>
                )}
                
                {repair.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {repair.description}
                  </p>
                )}
                
                <p className="text-xs text-gray-500">
                  Created: {new Date(repair.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {repairs.length > 5 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500 text-center">
            Showing 5 of {repairs.length} outstanding repairs
          </p>
        </div>
      )}
      
      {repairs.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <a 
            href="/dashboard/outstanding-repairs" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all outstanding repairs →
          </a>
        </div>
      )}
    </div>
  );
}
