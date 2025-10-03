import { requireAuth } from '@/lib/auth';
import { type RepairType } from '@/lib/validations/outstanding-repairs';
import WorkflowListClient from './WorkflowListClient';
import CreateWorkflowButton from './CreateWorkflowButton';

interface WorkflowDefinition {
  id: string;
  name: string;
  appliesTo: { repairType: RepairType; sku?: string };
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

interface WorkflowListProps {
  workflows: WorkflowDefinition[];
  searchParams?: {
    repairType?: RepairType;
    showInactive?: string;
    mode?: string;
    editId?: string;
  };
}

export default async function WorkflowList({ workflows, searchParams }: WorkflowListProps) {
  const user = await requireAuth();
  
  // All users can modify workflows
  const canModifyWorkflows = true;
  
  const filterRepairType = searchParams?.repairType;
  const showInactiveWorkflows = searchParams?.showInactive === 'true';

  // Filter workflows based on search params
  const filteredWorkflows = workflows.filter(workflow => {
    if (filterRepairType && workflow.appliesTo?.repairType !== filterRepairType) {
      return false;
    }
    if (!showInactiveWorkflows && !workflow.isActive) {
      return false;
    }
    return true;
  });

  // Group workflows by specificity (combination vs repair type only)
  const groupedWorkflows = filteredWorkflows.reduce((acc, workflow) => {
    const key = workflow.appliesTo?.sku ? 'specific' : 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(workflow);
    return acc;
  }, {} as { specific?: WorkflowDefinition[]; general?: WorkflowDefinition[] });

  const repairTypes = [
    'TROLLEY_REPLACEMENT',
    'HANDLE_REPLACEMENT',
    'LINER_REPLACEMENT',
    'ZIPPER_SLIDER',
    'ZIPPER_TAPE',
    'ZIPPER_FULL_REPLACEMENT',
    'WHEEL_REPLACEMENT',
    'LOCK_REPLACEMENT',
    'LOGO_REPLACEMENT',
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Configuration</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage repair workflows for different repair types and SKUs. More specific configurations take precedence.
          </p>
        </div>
        {canModifyWorkflows && <CreateWorkflowButton />}
      </div>

      {/* Workflow Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{workflows.length}</div>
          <div className="text-sm text-gray-600">Total Workflows</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {workflows.filter(w => w.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Workflows</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">
            {workflows.filter(w => w.appliesTo.sku).length}
          </div>
          <div className="text-sm text-gray-600">SKU-Specific</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {workflows.filter(w => !w.appliesTo.sku).length}
          </div>
          <div className="text-sm text-gray-600">General</div>
        </div>
      </div>

      {/* Client Component for Interactive UI */}
      <WorkflowListClient 
        workflows={workflows}
        filteredWorkflows={filteredWorkflows}
        groupedWorkflows={groupedWorkflows}
        canModifyWorkflows={canModifyWorkflows || false}
        repairTypes={repairTypes}
        filterRepairType={filterRepairType}
        showInactiveWorkflows={showInactiveWorkflows}
        searchParams={searchParams}
      />
    </div>
  );
}
