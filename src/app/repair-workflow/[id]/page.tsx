import { requireAuth } from '@/lib/auth';
import { getRepairWithWorkflow } from '@/actions/repair-workflow';
import RepairWorkflowClient from './RepairWorkflowClient';

interface RepairWorkflowPageProps {
  params: {
    id: string;
  };
}

export default async function RepairWorkflowPage({ params }: RepairWorkflowPageProps) {
  const user = await requireAuth();
  
  const result = await getRepairWithWorkflow(params.id);
  
  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Error</h3>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{result.error}</p>
          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 text-center"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RepairWorkflowClient 
        repair={result.repair} 
        workflow={result.workflow}
      />
    </div>
  );
}
