interface WorkflowStatsTileProps {
  workflows: Array<{
    name: string;
    version: number;
    isActive: boolean;
    sessionCount: number; // This now represents outstanding repairs count
  }>;
}

export function WorkflowStatsTile({ workflows }: WorkflowStatsTileProps) {
  const totalOutstandingRepairs = workflows.reduce((sum, workflow) => {
    const repairCount = Number(workflow.sessionCount) || 0;
    return sum + repairCount;
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Workflow Usage</h2>
        <span className="text-sm text-gray-500">{workflows.length} workflows</span>
      </div>
      
      {workflows.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="mt-2 text-gray-500">No workflows found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((workflow, index) => {
            const repairCount = Number(workflow.sessionCount) || 0;
            const percentage = totalOutstandingRepairs > 0 ? (repairCount / totalOutstandingRepairs) * 100 : 0;
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-800">
                      {workflow.name}
                    </p>
                    <span className="text-xs text-gray-500">
                      v{workflow.version}
                    </span>
                    {workflow.isActive ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 min-w-[3rem] text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <span className="text-lg font-semibold text-gray-800">
                    {repairCount}
                  </span>
                  <p className="text-xs text-gray-500">repairs</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {workflows.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Outstanding Repairs</span>
            <span className="font-medium">{totalOutstandingRepairs}</span>
          </div>
          
          <div className="mt-2">
            <a 
              href="/dashboard/workflows" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Manage workflows →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
