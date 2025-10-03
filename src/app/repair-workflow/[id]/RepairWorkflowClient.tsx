'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeRepair } from '@/actions/repair-workflow';
import { OutstandingRepair, WorkflowDefinition, WorkflowFailureAnswer } from '@/lib/schema';

interface RepairWorkflowClientProps {
  repair: OutstandingRepair & {
    item: {
      id: string;
      lp: string;
      sku: string | null;
      model: string | null;
      status: string;
      grade: string | null;
      newBarcode: string | null;
      locationId: string | null;
    };
    assignedTechnician: {
      id: string;
      name: string | null;
      email: string | null;
    } | null;
  };
  workflow: WorkflowDefinition & {
    failureAnswers: WorkflowFailureAnswer[];
    pngFilePath?: string | null;
    videoUrl?: string | null;
  };
}

export default function RepairWorkflowClient({ repair, workflow }: RepairWorkflowClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [wasSuccessful, setWasSuccessful] = useState<boolean | null>(null);
  const [selectedFailureReason, setSelectedFailureReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);


  const handleViewSOP = () => {
    window.open(workflow.sopUrl, '_blank');
  };

  const handleCompletionSubmit = () => {
    if (wasSuccessful === null) {
      setError('Please select whether the repair was successful');
      return;
    }

    if (!wasSuccessful && !selectedFailureReason) {
      setError('Failure reason is required when repair could not be completed');
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await completeRepair({
          repairId: repair.id,
          wasSuccessful,
          failureReason: !wasSuccessful ? selectedFailureReason : undefined,
          notes: notes.trim() || undefined,
        });

        if (result.success) {
          // Navigate back to dashboard
          router.push('/dashboard');
        } else {
          setError(result.error || 'Failed to complete repair');
        }
      } catch (err) {
        console.error('Error completing repair:', err);
        setError('An unexpected error occurred');
      }
    });
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  const formatRepairType = (repairType: string): string => {
    return repairType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1: return 'bg-gray-100 text-gray-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: number): string => {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Medium';
      case 3: return 'High';
      case 4: return 'Urgent';
      default: return 'Unknown';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Repair Workflow</h1>
            <p className="text-gray-600 mt-1">Complete the repair process for this item</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cancel repair"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Item Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">License Plate</p>
            <p className="font-medium text-gray-900">{repair.item.lp}</p>
          </div>
          
          {repair.item.sku && (
            <div>
              <p className="text-sm text-gray-500">SKU</p>
              <p className="font-medium text-gray-900">{repair.item.sku}</p>
            </div>
          )}
          
          {repair.item.model && (
            <div>
              <p className="text-sm text-gray-500">Model</p>
              <p className="font-medium text-gray-900">{repair.item.model}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-gray-500">Item Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              repair.item.status === 'AWAITING_REPAIR' ? 'bg-yellow-100 text-yellow-800' :
              repair.item.status === 'IN_REPAIR' ? 'bg-blue-100 text-blue-800' :
              repair.item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {repair.item.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Repair Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Repair Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Repair Type</p>
            <p className="font-medium text-gray-900">{formatRepairType(repair.repairType)}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Priority</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(repair.priority)}`}>
              {getPriorityLabel(repair.priority)}
            </span>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Assigned Technician</p>
            <p className="font-medium text-gray-900">
              {repair.assignedTechnician?.name || 'Unassigned'}
            </p>
          </div>
          
          {repair.description && (
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium text-gray-900">{repair.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Workflow Name</p>
            <p className="font-medium text-gray-900">{workflow.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Version</p>
            <p className="font-medium text-gray-900">{workflow.version}</p>
          </div>
        </div>
        
        {/* SOP Image Display */}
        {workflow.pngFilePath && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">SOP Image</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <img
                src={`/api/data/workflow-images?path=${encodeURIComponent(workflow.pngFilePath)}`}
                alt={`SOP for ${workflow.name}`}
                className="w-full h-auto max-h-96 object-contain bg-gray-50"
                onError={(e) => {
                  console.error('Failed to load SOP image:', e);
                  // Hide the image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
        
        {/* Video Display */}
        {workflow.videoUrl && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Repair Video</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <video
                src={workflow.videoUrl}
                controls
                className="w-full h-auto max-h-96 bg-gray-50"
                onError={(e) => {
                  console.error('Failed to load repair video:', e);
                  // Hide the video if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleViewSOP}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Repair SOP
          </button>
        </div>
      </div>

      {/* Completion Form */}
      {!showCompletionForm ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready to Complete Repair?</h2>
          <p className="text-gray-600 mb-6">
            Please review the SOP and perform the repair. When you're ready to complete the repair process, click the button below.
          </p>
          
          <button
            onClick={() => setShowCompletionForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Complete Repair
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Repair Completion</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 10.414l1.293-1.293a1 1 0 011.414 1.414L10 11.414l1.293 1.293a1 1 0 01-1.414 1.414L10 10.586l-1.293 1.293a1 1 0 01-1.414-1.414L10 9.172 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Success/Failure Question */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Were you able to complete the repair?</p>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wasSuccessful"
                    value="true"
                    checked={wasSuccessful === true}
                    onChange={() => setWasSuccessful(true)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes, repair completed successfully</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wasSuccessful"
                    value="false"
                    checked={wasSuccessful === false}
                    onChange={() => setWasSuccessful(false)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">No, repair could not be completed</span>
                </label>
              </div>
            </div>

            {/* Failure Reason Selection */}
            {wasSuccessful === false && workflow.failureAnswers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Why were you not able to complete the repair? <span className="text-red-500">*</span>
                </p>
                <div className="space-y-2">
                  {workflow.failureAnswers.map((answer) => (
                    <label key={answer.id} className="flex items-start">
                      <input
                        type="radio"
                        name="failureReason"
                        value={answer.code}
                        checked={selectedFailureReason === answer.code}
                        onChange={() => setSelectedFailureReason(answer.code)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 mt-1"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-700">{answer.label}</span>
                        {answer.description && (
                          <p className="text-sm text-gray-500">{answer.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any additional notes about the repair..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCompletionSubmit}
                disabled={isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Repair Completion'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
