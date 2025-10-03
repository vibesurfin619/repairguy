import Link from 'next/link';
import { type RepairType } from '@/lib/validations/outstanding-repairs';

interface WorkflowDefinition {
  id: string;
  name: string;
  appliesTo?: { repairType?: RepairType; sku?: string };
  sopUrl: string;
  pngFilePath?: string;
  videoUrl?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  failureAnswers?: Array<{
    id: string;
    code: string;
    label: string;
    description?: string;
    requiresNotes: boolean;
  }>;
}

interface WorkflowCardProps {
  workflow: WorkflowDefinition;
  canEdit: boolean;
  isSpecific: boolean;
}

export default function WorkflowCard({ workflow, canEdit, isSpecific }: WorkflowCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow border p-4 ${!workflow.isActive ? 'opacity-75 border-gray-300' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">{workflow.name}</h3>
            {!workflow.isActive && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                Inactive
              </span>
            )}
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              v{workflow.version}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Repair Type:</span>
              <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                {workflow.appliesTo?.repairType ? workflow.appliesTo.repairType.replace(/_/g, ' ') : 'Unknown'}
              </span>
              {workflow.appliesTo?.sku && (
                <>
                  <span className="font-medium">SKU:</span>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono text-xs">
                    {workflow.appliesTo.sku}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="font-medium">SOP:</span>
              <a 
                href={workflow.sopUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Document
              </a>
            </div>
            
            {(workflow.pngFilePath || workflow.videoUrl) && (
              <div className="flex items-center space-x-4">
                <span className="font-medium">Media:</span>
                <div className="flex space-x-2">
                  {workflow.pngFilePath && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      📷 Image
                    </span>
                  )}
                  {workflow.videoUrl && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                      🎥 Video
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {workflow.failureAnswers && workflow.failureAnswers.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="font-medium">Failure Answers:</span>
                <span className="text-gray-500">
                  {workflow.failureAnswers.length} configured
                </span>
              </div>
            )}
            
            <div className="text-xs text-gray-400">
              Created: {new Date(workflow.createdAt).toLocaleDateString()} • 
              Updated: {new Date(workflow.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        {canEdit && (
          <Link
            href={`/dashboard/workflows?mode=edit&editId=${workflow.id}`}
            className="ml-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium"
          >
            Edit
          </Link>
        )}
      </div>
      
      {workflow.failureAnswers && workflow.failureAnswers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Failure Answers:</h4>
          <div className="flex flex-wrap gap-2">
            {workflow.failureAnswers.map((answer) => (
              <span
                key={answer.id}
                className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-medium"
                title={answer.description}
              >
                {answer.code}: {answer.label}
                {answer.requiresNotes && ' *'}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">* Requires technician notes</p>
        </div>
      )}
    </div>
  );
}
