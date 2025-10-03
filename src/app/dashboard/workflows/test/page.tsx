import { requireAuth } from '@/lib/auth';
import dbOperations from '@/lib/db';
import { findApplicableWorkflow } from '@/actions/workflows';
import { type RepairType } from '@/lib/validations/outstanding-repairs';

export default async function WorkflowTestPage() {
  const user = await requireAuth();
  
  // Test workflow precedence logic
  async function testWorkflowPrecedence() {
    'use server';
    
    // Test data
    const testCases = [
      { repairType: 'TROLLEY_REPLACEMENT' as RepairType, sku: 'SKU123' },
      { repairType: 'TROLLEY_REPLACEMENT' as RepairType },
      { repairType: 'HANDLE_REPLACEMENT' as RepairType, sku: 'SKU456' },
      { repairType: 'HANDLE_REPLACEMENT' as RepairType },
    ];
    
    console.log('Testing workflow precedence logic...');
    
    for (const testCase of testCases) {
      const result = await findApplicableWorkflow(testCase);
      console.log(`Test case: ${JSON.stringify(testCase)}`);
      console.log(`Result: ${result.success ? JSON.stringify(result.workflow) : result.error}`);
      console.log('---');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Workflow Configuration Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Test Workflow Precedence Logic</h2>
          <p className="text-sm text-gray-600 mb-4">
            This tests that workflows with both repair type and SKU take precedence over workflows with only repair type.
          </p>
          
          <form action={testWorkflowPrecedence}>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Run Test (Check Console)
            </button>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Workflow Precedence Rules</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-gray-900">1. Specific Configuration (Repair Type + SKU)</h3>
              <p>When both repair type and SKU are specified, this configuration takes highest precedence.</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                {`{ repairType: "TROLLEY_REPLACEMENT", sku: "SKU123" }`}
              </code>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-gray-900">2. General Configuration (Repair Type Only)</h3>
              <p>When only repair type is specified, this serves as a fallback for all SKUs of that repair type.</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                {`{ repairType: "TROLLEY_REPLACEMENT" }`}
              </code>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-medium text-gray-900">3. Example Scenario</h3>
              <p>If you have:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>General workflow: TROLLEY_REPLACEMENT (no SKU)</li>
                <li>Specific workflow: TROLLEY_REPLACEMENT + SKU123</li>
              </ul>
              <p className="mt-2">
                Items with SKU123 and TROLLEY_REPLACEMENT will use the specific workflow.
                All other TROLLEY_REPLACEMENT items will use the general workflow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
