'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RepairSession, WorkflowQuestion, RepairAnswer, Item, User } from '@/lib/schema';
import { saveRepairAnswers, completeRepairSession, abandonRepairSession } from '@/actions/repair-sessions';

interface RepairSessionClientProps {
  repairSession: RepairSession & {
    item: Item;
    workflowDefinition: {
      id: string;
      name: string;
      version: number;
      sopUrl: string;
      workflowQuestions: WorkflowQuestion[];
    };
    repairAnswers: RepairAnswer[];
  };
  workflowQuestions: WorkflowQuestion[];
  existingAnswers: RepairAnswer[];
  item: Item;
  user: User;
}

interface AnswerState {
  [questionId: string]: {
    answer: boolean | null;
    notes: string;
  };
}

export default function RepairSessionClient({
  repairSession,
  workflowQuestions,
  existingAnswers,
  item,
  user,
}: RepairSessionClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>(() => {
    const initialState: AnswerState = {};
    workflowQuestions.forEach(question => {
      const existingAnswer = existingAnswers.find(answer => answer.questionId === question.id);
      initialState[question.id] = {
        answer: existingAnswer ? existingAnswer.answer : null,
        notes: existingAnswer?.notes || '',
      };
    });
    return initialState;
  });
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = workflowQuestions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];

  const handleAnswerChange = (answer: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        answer,
      },
    }));
    setError(null);
  };

  const handleNotesChange = (notes: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        notes,
      },
    }));
  };

  const handleNext = () => {
    if (currentAnswer.answer === null && currentQuestion.required) {
      setError('This question is required. Please provide an answer.');
      return;
    }

    if (currentQuestion.critical && currentAnswer.answer === false && currentQuestion.failOnNo) {
      setError('This is a critical question. A "No" answer will fail the repair.');
      return;
    }

    setError(null);
    
    if (currentQuestionIndex < workflowQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered, complete the session
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setError(null);
    }
  };

  const handleComplete = () => {
    startTransition(async () => {
      try {
        // Save all answers first
        const answersToSave = Object.entries(answers).map(([questionId, answerData]) => ({
          questionId,
          answer: answerData.answer!,
          notes: answerData.notes,
        }));

        const saveResult = await saveRepairAnswers({
          repairSessionId: repairSession.id,
          answers: answersToSave,
        });

        if (!saveResult.success) {
          setError(saveResult.error || 'Failed to save answers');
          return;
        }

        // Complete the session
        const completeResult = await completeRepairSession({
          repairSessionId: repairSession.id,
        });

        if (!completeResult.success) {
          setError(completeResult.error || 'Failed to complete session');
          return;
        }

        setIsCompleted(true);
      } catch (err) {
        console.error('Failed to complete repair session:', err);
        setError('Failed to complete repair session');
      }
    });
  };

  const handleAbandon = () => {
    if (confirm('Are you sure you want to abandon this repair session? All progress will be lost.')) {
      startTransition(async () => {
        try {
          const result = await abandonRepairSession({
            repairSessionId: repairSession.id,
          });

          if (!result.success) {
            setError(result.error || 'Failed to abandon repair session');
            return;
          }

          router.push('/dashboard');
        } catch (err) {
          console.error('Failed to abandon repair session:', err);
          setError('Failed to abandon repair session');
        }
      });
    }
  };

  if (isCompleted) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Repair Session Completed</h2>
        <p className="text-gray-600 mb-8">
          Your repair session has been successfully completed and submitted for review.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Repair Session #{repairSession.id.slice(0, 8)}
            </h1>
            <p className="text-gray-600 mt-1">
              {repairSession.workflowDefinition.name} - Version {repairSession.workflowDefinition.version}
            </p>
          </div>
          <button
            onClick={handleAbandon}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          >
            Abandon Session
          </button>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Item</p>
            <p className="font-medium text-gray-900">{item.lp}</p>
            {item.sku && <p className="text-sm text-gray-600">SKU: {item.sku}</p>}
          </div>
          <div>
            <p className="text-sm text-gray-500">Technician</p>
            <p className="font-medium text-gray-900">{user.name || user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Started</p>
            <p className="font-medium text-gray-900">
              {new Date(repairSession.startedAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        {repairSession.workflowDefinition.sopUrl && (
          <div className="mt-4">
            <a
              href={repairSession.workflowDefinition.sopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View SOP Document
            </a>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {workflowQuestions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / workflowQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              {currentQuestion.critical && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-3">
                  Critical
                </span>
              )}
              {currentQuestion.required && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Required
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.prompt}
            </h3>
            
            {currentQuestion.helpText && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">{currentQuestion.helpText}</p>
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => handleAnswerChange(true)}
                className={`flex-1 py-3 px-6 rounded-lg border-2 transition duration-300 ${
                  currentAnswer.answer === true
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Yes
                </div>
              </button>
              
              <button
                onClick={() => handleAnswerChange(false)}
                className={`flex-1 py-3 px-6 rounded-lg border-2 transition duration-300 ${
                  currentAnswer.answer === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-red-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  No
                </div>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={currentAnswer.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes or observations..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-300"
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                currentQuestionIndex === workflowQuestions.length - 1 ? 'Complete Session' : 'Next'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
