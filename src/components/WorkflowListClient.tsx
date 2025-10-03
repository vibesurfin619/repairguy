'use client';

import { useRouter } from 'next/navigation';
import { type RepairType } from '@/lib/validations/outstanding-repairs';
import WorkflowCard from './WorkflowCard';
import CreateWorkflowButton from './CreateWorkflowButton';

interface WorkflowDefinition {
  id: string;
  name: string;
  appliesTo: { repairType: RepairType; sku?: string };
  sopUrl: string;
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

interface WorkflowListClientProps {
  workflows: WorkflowDefinition[];
  filteredWorkflows: WorkflowDefinition[];
  groupedWorkflows: { specific?: WorkflowDefinition[]; general?: WorkflowDefinition[] };
  canModifyWorkflows: boolean;
  repairTypes: readonly RepairType[];
  filterRepairType?: RepairType;
  showInactiveWorkflows: boolean;
  searchParams?: {
    repairType?: RepairType;
    showInactive?: string;
    mode?: string;
    editId?: string;
  };
}

export default function WorkflowListClient({
  workflows,
  filteredWorkflows,
  groupedWorkflows,
  canModifyWorkflows,
  repairTypes,
  filterRepairType,
  showInactiveWorkflows,
  searchParams,
}: WorkflowListClientProps) {
  const router = useRouter();

  const handleFilterChange = (newParams: Record<string, string | undefined>) => {
    const url = new URL(window.location.href);
    
    // Update search params
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });

    // Preserve existing params
    if (searchParams?.mode) {
      url.searchParams.set('mode', searchParams.mode);
    }
    if (searchParams?.editId) {
      url.searchParams.set('editId', searchParams.editId);
    }

    router.push(url.pathname + url.search);
  };

  return (
    <>
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg flex flex-wrap gap-4 items-center">
        <div>
          <label htmlFor="repairType" className="block text-sm font-medium text-gray-700">
            Filter by Repair Type
          </label>
          <select
            id="repairType"
            value={filterRepairType || ''}
            onChange={(e) => handleFilterChange({ repairType: e.target.value || undefined })}
            className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Repair Types</option>
            {repairTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactiveWorkflows}
            onChange={(e) => handleFilterChange({ showInactive: e.target.checked ? 'true' : undefined })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showInactive" className="ml-2 block text-sm text-gray-900">
            Show inactive workflows
          </label>
        </div>
      </div>

      {/* No workflows message */}
      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border">
          <div className="text-gray-400 text-lg mb-2">No workflows found</div>
          <p className="text-gray-600 text-sm mb-4">
            {workflows.length === 0 
              ? "No workflows have been created yet."
              : "No workflows match your current filters."
            }
          </p>
          {canModifyWorkflows && workflows.length === 0 && <CreateWorkflowButton />}
        </div>
      )}

      {/* Specific Workflows (Repair Type + SKU) */}
      {groupedWorkflows.specific && groupedWorkflows.specific.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
              SKU-Specific Workflows
            </span>
            <span className="text-sm text-gray-500">
              ({groupedWorkflows.specific.length} workflows)
            </span>
          </h2>
          <div className="grid gap-4">
            {groupedWorkflows.specific.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                canEdit={canModifyWorkflows}
                isSpecific={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* General Workflows (Repair Type Only) */}
      {groupedWorkflows.general && groupedWorkflows.general.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
              General Workflows
            </span>
            <span className="text-sm text-gray-500">
              ({groupedWorkflows.general.length} workflows)
            </span>
          </h2>
          <div className="grid gap-4">
            {groupedWorkflows.general.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                canEdit={canModifyWorkflows}
                isSpecific={false}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
