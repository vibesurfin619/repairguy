'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createWorkflowDefinition,
  updateWorkflowDefinition,
  deleteWorkflowDefinition,
} from '@/actions/workflows';
import {
  type CreateWorkflowDefinitionInput,
  type UpdateWorkflowDefinitionInput,
  type FailureAnswer,
} from '@/lib/validations/workflows';
import { type RepairType } from '@/lib/validations/outstanding-repairs';

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

interface WorkflowConfigurationFormProps {
  workflow?: {
    id: string;
    name: string;
    appliesTo: { repairType: RepairType; sku?: string };
    sopUrl: string;
    version: number;
    isActive: boolean;
    failureAnswers?: FailureAnswer[];
  };
  mode: 'create' | 'edit';
}

export default function WorkflowConfigurationForm({ workflow, mode }: WorkflowConfigurationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    repairType: workflow?.appliesTo?.repairType || ('TROLLEY_REPLACEMENT' as RepairType),
    sku: workflow?.appliesTo?.sku || '',
    sopUrl: workflow?.sopUrl || '',
    version: workflow?.version || 1,
    isActive: workflow?.isActive !== false,
  });
  
  const [failureAnswers, setFailureAnswers] = useState<FailureAnswer[]>(
    workflow?.failureAnswers || []
  );
  
  const [newFailureAnswer, setNewFailureAnswer] = useState<Partial<FailureAnswer>>({
    code: '',
    label: '',
    description: '',
    requiresNotes: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddFailureAnswer = () => {
    if (!newFailureAnswer.code || !newFailureAnswer.label) {
      alert('Code and label are required for failure answers');
      return;
    }

    const failureAnswer: FailureAnswer = {
      code: newFailureAnswer.code,
      label: newFailureAnswer.label,
      description: newFailureAnswer.description || undefined,
      requiresNotes: newFailureAnswer.requiresNotes || false,
    };

    setFailureAnswers(prev => [...prev, failureAnswer]);
    setNewFailureAnswer({
      code: '',
      label: '',
      description: '',
      requiresNotes: false,
    });
  };

  const handleRemoveFailureAnswer = (index: number) => {
    setFailureAnswers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      const input = {
        ...formData,
        sku: formData.sku || undefined,
        failureAnswers,
      };

      let result;
      if (workflow) {
        result = await updateWorkflowDefinition({
          id: workflow.id,
          ...input,
        } as UpdateWorkflowDefinitionInput);
      } else {
        result = await createWorkflowDefinition(input as CreateWorkflowDefinitionInput);
      }

      if (result.success) {
        router.push('/dashboard/workflows');
      } else {
        alert(result.error);
      }
    });
  };

  const handleDelete = () => {
    if (!workflow) return;
    
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteWorkflowDefinition(workflow.id);
      
      if (result.success) {
        router.push('/dashboard/workflows');
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'edit' ? 'Edit Workflow Configuration' : 'Create New Workflow Configuration'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure repair workflows for specific repair types and SKUs. More specific configurations (repair type + SKU) take precedence over general ones (repair type only).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Workflow Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="repairType" className="block text-sm font-medium text-gray-700">
              Repair Type *
            </label>
            <select
              id="repairType"
              value={formData.repairType}
              onChange={(e) => handleInputChange('repairType', e.target.value as RepairType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              {repairTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU (Optional)
            </label>
            <input
              type="text"
              id="sku"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Leave empty for general repair type configuration"
            />
            <p className="mt-1 text-xs text-gray-500">
              If specified, this workflow will only apply to items with this exact SKU and repair type combination.
            </p>
          </div>

          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-700">
              Version
            </label>
            <input
              type="number"
              id="version"
              value={formData.version}
              onChange={(e) => handleInputChange('version', parseInt(e.target.value) || 1)}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* SOP URL */}
        <div>
          <label htmlFor="sopUrl" className="block text-sm font-medium text-gray-700">
            Standard Operating Procedure (SOP) URL *
          </label>
          <input
            type="url"
            id="sopUrl"
            value={formData.sopUrl}
            onChange={(e) => handleInputChange('sopUrl', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="https://example.com/sop-document.pdf"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            This document will be displayed to technicians during the repair process.
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active workflow (can be assigned to repair sessions)
          </label>
        </div>

        {/* Failure Answers Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Failure Answers</h3>
          <p className="text-sm text-gray-600 mb-4">
            Define predefined reasons why an item could not be repaired. These will be available as options when a repair fails.
          </p>

          {/* Existing Failure Answers */}
          {failureAnswers.length > 0 && (
            <div className="mb-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Current Failure Answers:</h4>
              {failureAnswers.map((answer, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                        {answer.code}
                      </span>
                      <span className="text-sm font-medium">{answer.label}</span>
                      {answer.requiresNotes && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Requires Notes
                        </span>
                      )}
                    </div>
                    {answer.description && (
                      <p className="text-xs text-gray-600 mt-1">{answer.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFailureAnswer(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Failure Answer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Code</label>
              <input
                type="text"
                value={newFailureAnswer.code || ''}
                onChange={(e) => setNewFailureAnswer(prev => ({ ...prev, code: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., PART_UNAVAILABLE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Label</label>
              <input
                type="text"
                value={newFailureAnswer.label || ''}
                onChange={(e) => setNewFailureAnswer(prev => ({ ...prev, label: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Required part not available"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea
                value={newFailureAnswer.description || ''}
                onChange={(e) => setNewFailureAnswer(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={2}
                placeholder="Additional details about this failure reason..."
              />
            </div>
            <div className="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                checked={newFailureAnswer.requiresNotes || false}
                onChange={(e) => setNewFailureAnswer(prev => ({ ...prev, requiresNotes: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Require technician notes when this failure reason is selected
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddFailureAnswer}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
          >
            Add Failure Answer
          </button>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div>
            {workflow && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeletePending}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {isDeletePending ? 'Deleting...' : 'Delete Workflow'}
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/workflows')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {isPending ? 'Saving...' : workflow ? 'Update Workflow' : 'Create Workflow'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}