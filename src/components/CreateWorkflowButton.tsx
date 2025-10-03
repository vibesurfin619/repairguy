import Link from 'next/link';

export default function CreateWorkflowButton() {
  return (
    <Link
      href="/dashboard/workflows?mode=create"
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
    >
      Create New Workflow
    </Link>
  );
}
