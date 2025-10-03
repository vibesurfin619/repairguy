import { requireAuth } from '@/lib/auth';
import dbOperations from '@/lib/db';
import WorkflowList from '@/components/WorkflowList';
import WorkflowConfigurationForm from '@/components/WorkflowConfigurationForm';
import { type RepairType } from '@/lib/validations/outstanding-repairs';

interface PageProps {
  searchParams: Promise<{
    repairType?: RepairType;
    showInactive?: string;
    mode?: string;
    editId?: string;
    error?: string;
  }>;
}

async function getWorkflowsWithFailureAnswers() {
  const workflows = await dbOperations.getWorkflowDefinitions();
  
  // Get failure answers for each workflow
  const workflowsWithFailures = await Promise.all(
    workflows.map(async (workflow) => {
      const failureAnswers = await dbOperations.getWorkflowFailureAnswers(workflow.id);
      
      return {
        ...workflow,
        appliesTo: workflow.appliesTo as { repairType?: RepairType; sku?: string } | undefined,
        failureAnswers: failureAnswers.map(fa => ({
          id: fa.id,
          code: fa.code,
          label: fa.label,
          description: fa.description || undefined,
          requiresNotes: fa.requiresNotes,
        })),
      };
    })
  );
  
  return workflowsWithFailures;
}

export default async function WorkflowConfigurationPage({ searchParams }: PageProps) {
  const user = await requireAuth();
  const resolvedSearchParams = await searchParams;
  
  const workflows = await getWorkflowsWithFailureAnswers();

  // Show form if in create mode
  if (resolvedSearchParams.mode === 'create') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <WorkflowConfigurationForm mode="create" />
        </div>
      </div>
    );
  }

  // Show form if in edit mode
  if (resolvedSearchParams.mode === 'edit' && resolvedSearchParams.editId) {
    const workflow = await dbOperations.getWorkflowDefinitionById(resolvedSearchParams.editId);
    if (!workflow) {
      return (
        <div className="min-h-screen bg-gray-100">
          <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                Workflow not found.
              </div>
            </div>
          </div>
        </div>
      );
    }

    const failureAnswers = await dbOperations.getWorkflowFailureAnswers(resolvedSearchParams.editId);
    
    const workflowWithFailures = {
      ...workflow,
      appliesTo: workflow.appliesTo as { repairType?: RepairType; sku?: string } | undefined,
      failureAnswers: failureAnswers.map(fa => ({
        id: fa.id,
        code: fa.code,
        label: fa.label,
        description: fa.description || undefined,
        requiresNotes: fa.requiresNotes,
      })),
    };

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <WorkflowConfigurationForm mode="edit" workflow={workflowWithFailures} />
        </div>
      </div>
    );
  }

  // Show error message if present
  const errorMessage = resolvedSearchParams.error;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {errorMessage && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">
              Error: {decodeURIComponent(errorMessage)}
            </div>
          </div>
        )}
        <WorkflowList workflows={workflows} searchParams={resolvedSearchParams} />
      </div>
    </div>
  );
}
