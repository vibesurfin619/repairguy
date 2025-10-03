import { requireAuth } from '@/lib/auth';
import { dbOperations } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import RepairSessionClient from './RepairSessionClient';

interface RepairSessionPageProps {
  params: {
    id: string;
  };
}

export default async function RepairSessionPage({ params }: RepairSessionPageProps) {
  const user = await requireAuth();
  
  // Get repair session with all related data
  const repairSession = await dbOperations.getRepairSessionWithDetails(params.id);
  
  if (!repairSession) {
    notFound();
  }
  
  // Check if user has access to this repair session
  if (repairSession.technicianId !== user.id) {
    notFound();
  }
  
  // Get workflow questions in order
  const workflowQuestions = repairSession.workflowDefinition?.workflowQuestions || [];
  
  // Get existing answers
  const existingAnswers = repairSession.repairAnswers || [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <RepairSessionClient
          repairSession={repairSession}
          workflowQuestions={workflowQuestions}
          existingAnswers={existingAnswers}
          item={repairSession.item}
          user={user}
        />
      </div>
    </div>
  );
}
