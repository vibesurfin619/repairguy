import { db } from '../src/lib/db';
import { outstandingRepairs, workflowDefinitions, workflowFailureAnswers, items } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

async function testRepairWorkflow() {
  try {
    console.log('Testing Repair Workflow System...\n');

    // Check if there are any outstanding repairs
    const repairs = await db.select()
      .from(outstandingRepairs)
      .where(eq(outstandingRepairs.status, 'PENDING'))
      .limit(5);

    console.log(`Found ${repairs.length} pending repairs:`);
    repairs.forEach((repair, index) => {
      console.log(`${index + 1}. Repair ID: ${repair.id}`);
      console.log(`   Type: ${repair.repairType}`);
      console.log(`   Status: ${repair.status}`);
      console.log(`   Item ID: ${repair.itemId}`);
      console.log(`   Created: ${repair.createdAt}`);
      console.log('');
    });

    // Check if there are any workflow definitions
    const workflows = await db.select()
      .from(workflowDefinitions)
      .where(eq(workflowDefinitions.isActive, true))
      .limit(5);

    console.log(`Found ${workflows.length} active workflow definitions:`);
    workflows.forEach((workflow, index) => {
      console.log(`${index + 1}. Workflow ID: ${workflow.id}`);
      console.log(`   Name: ${workflow.name}`);
      console.log(`   Version: ${workflow.version}`);
      console.log(`   Applies To: ${JSON.stringify(workflow.appliesTo)}`);
      console.log(`   SOP URL: ${workflow.sopUrl}`);
      console.log('');
    });

    // Check if there are any failure answers
    const failureAnswers = await db.select()
      .from(workflowFailureAnswers)
      .limit(10);

    console.log(`Found ${failureAnswers.length} failure answers:`);
    failureAnswers.forEach((answer, index) => {
      console.log(`${index + 1}. Answer ID: ${answer.id}`);
      console.log(`   Workflow ID: ${answer.workflowId}`);
      console.log(`   Code: ${answer.code}`);
      console.log(`   Label: ${answer.label}`);
      console.log(`   Description: ${answer.description || 'None'}`);
      console.log(`   Requires Notes: ${answer.requiresNotes}`);
      console.log('');
    });

    console.log('Repair workflow system test completed successfully!');
  } catch (error) {
    console.error('Error testing repair workflow system:', error);
  }
}

testRepairWorkflow();
