'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { scanItem } from '@/actions/items';
import { Item, WorkflowDefinition, RepairSession, OutstandingRepair, User } from '@/lib/schema';

interface ScanItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OutstandingRepairWithTechnician extends OutstandingRepair {
  assignedTechnician: {
    id: string | null;
    name: string | null;
    email: string | null;
  } | null;
}

interface ItemWithDetails extends Item {
  workflow: WorkflowDefinition | null;
  activeSessions: RepairSession[];
  pendingRepairs: OutstandingRepairWithTechnician[];
  completedRepairs: OutstandingRepairWithTechnician[];
}

export default function ScanItemModal({ isOpen, onClose }: ScanItemModalProps) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [lp, setLp] = useState('');
  const [scannedItem, setScannedItem] = useState<ItemWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLp('');
      setScannedItem(null);
      setError(null);
      // Focus the input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    
    // Clear timeout when modal closes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!lp.trim()) {
      setError('Please enter a license plate');
      return;
    }

    console.log('Starting scan for LP:', lp.trim());

    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      setError('Scan timed out. Please try again.');
    }, 30000); // 30 second timeout

    startTransition(async () => {
      try {
        console.log('Calling scanItem server action...');
        const result = await scanItem({ lp: lp.trim() });
        
        // Clear timeout if we get a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        console.log('Scan result received:', result);
        
        if (result.success && 'item' in result && result.item) {
          console.log('Scan successful, setting item:', result.item);
          setScannedItem(result.item as ItemWithDetails);
        } else {
          const errorMessage = 'message' in result ? result.message : ('error' in result ? result.error : 'Failed to find item');
          console.log('Scan failed:', errorMessage);
          console.log('Debug info:', 'debug' in result ? result.debug : undefined);
          
          let finalErrorMessage = errorMessage;
          
          // Add debug info for development
          if ('debug' in result && result.debug && process.env.NODE_ENV === 'development') {
            finalErrorMessage += `\n\nDebug Info:\nSearched for: "${result.debug.searchedFor}"\nSample items in DB: ${result.debug.sampleItems?.join(', ') || 'none'}`;
          }
          
          setError(finalErrorMessage as string);
        }
      } catch (err) {
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        console.error('Scan error:', err);
        setError('An unexpected error occurred');
      }
    });
  };

  const handleClose = () => {
    setLp('');
    setScannedItem(null);
    setError(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Scan Repair Item</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scan Form */}
          {!scannedItem && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="lp" className="block text-sm font-medium text-gray-700 mb-2">
                  License Plate (LP)
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="lp"
                  value={lp}
                  onChange={(e) => setLp(e.target.value)}
                  placeholder="Enter or scan the license plate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  disabled={isPending}
                />
                <p className="text-sm text-gray-500 mt-1">
                  You can type the license plate or use a barcode scanner
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isPending || !lp.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning...
                    </>
                  ) : (
                    'Scan Item'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Item Details */}
          {scannedItem && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Item Found!</p>
                    <p className="text-sm text-green-700">License Plate: {scannedItem.lp}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">License Plate</p>
                    <p className="font-medium text-gray-900">{scannedItem.lp}</p>
                  </div>
                  
                  {scannedItem.sku && (
                    <div>
                      <p className="text-sm text-gray-500">SKU</p>
                      <p className="font-medium text-gray-900">{scannedItem.sku}</p>
                    </div>
                  )}
                  
                  {scannedItem.model && (
                    <div>
                      <p className="text-sm text-gray-500">Model</p>
                      <p className="font-medium text-gray-900">{scannedItem.model}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scannedItem.status)}`}>
                      {scannedItem.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {scannedItem.grade && (
                    <div>
                      <p className="text-sm text-gray-500">Grade</p>
                      <p className="font-medium text-gray-900">{scannedItem.grade}</p>
                    </div>
                  )}
                  
                  {scannedItem.newBarcode && (
                    <div>
                      <p className="text-sm text-gray-500">New Barcode</p>
                      <p className="font-medium text-gray-900">{scannedItem.newBarcode}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(scannedItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {new Date(scannedItem.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Workflow Information */}
              {scannedItem.workflow && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Current Workflow</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-600">Workflow Name</p>
                      <p className="font-medium text-blue-900">{scannedItem.workflow.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Version</p>
                      <p className="font-medium text-blue-900">{scannedItem.workflow.version}</p>
                    </div>
                    {scannedItem.workflow.sopUrl && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-blue-600">SOP URL</p>
                        <a 
                          href={scannedItem.workflow.sopUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-800 underline"
                        >
                          {scannedItem.workflow.sopUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Active Repair Sessions */}
              {scannedItem.activeSessions.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4">
                    Active Repair Sessions ({scannedItem.activeSessions.length})
                  </h3>
                  <div className="space-y-3">
                    {scannedItem.activeSessions.map((session) => (
                      <div key={session.id} className="bg-white rounded p-3 border border-orange-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">Session #{session.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600">Started: {new Date(session.startedAt).toLocaleString()}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                            {session.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outstanding Repairs */}
              {scannedItem.pendingRepairs.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                    Outstanding Repairs ({scannedItem.pendingRepairs.length})
                  </h3>
                  <div className="space-y-4">
                    {scannedItem.pendingRepairs.map((repair) => (
                      <div key={repair.id} className="bg-white rounded-lg p-4 border border-yellow-100">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{formatRepairType(repair.repairType)}</h4>
                            <p className="text-sm text-gray-600">Created: {new Date(repair.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRepairStatusColor(repair.status)}`}>
                              {repair.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        {repair.description && (
                          <p className="text-sm text-gray-700 mb-3">{repair.description}</p>
                        )}
                        
                        <div className="text-sm">
                          <div>
                            <p className="text-gray-500">Assigned Technician</p>
                            <p className="font-medium text-gray-900">
                              {repair.assignedTechnician?.name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Repairs */}
              {scannedItem.completedRepairs.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">
                    Completed Repairs ({scannedItem.completedRepairs.length})
                  </h3>
                  <div className="space-y-4">
                    {scannedItem.completedRepairs.map((repair) => (
                      <div key={repair.id} className="bg-white rounded-lg p-4 border border-green-100">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{formatRepairType(repair.repairType)}</h4>
                            <p className="text-sm text-gray-600">
                              Completed: {repair.completedAt ? new Date(repair.completedAt).toLocaleDateString() : 'Date not set'}
                            </p>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRepairStatusColor(repair.status)}`}>
                              {repair.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        {repair.description && (
                          <p className="text-sm text-gray-700 mb-3">{repair.description}</p>
                        )}
                        
                        <div className="text-sm">
                          <div>
                            <p className="text-gray-500">Technician</p>
                            <p className="font-medium text-gray-900">
                              {repair.assignedTechnician?.name || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setScannedItem(null);
                    setLp('');
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                >
                  Scan Another Item
                </button>
                <button
                  onClick={handleClose}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRepairStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatRepairType(repairType: string): string {
  return repairType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'AWAITING_REPAIR':
      return 'bg-yellow-100 text-yellow-800';
    case 'IN_REPAIR':
      return 'bg-blue-100 text-blue-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'REQUIRES_REVIEW':
      return 'bg-orange-100 text-orange-800';
    case 'SCRAP':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getSessionStatusColor(status: string): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'SUBMITTED':
      return 'bg-green-100 text-green-800';
    case 'ABANDONED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
