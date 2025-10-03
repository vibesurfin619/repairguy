'use client';

import { useState, useTransition } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  syncClerkUsersToDatabase, 
  getAllUsers
} from '@/actions/users';
import type { User } from '@/lib/schema';

interface UserManagementProps {
  initialUsers?: User[];
}

export default function UserManagement({ initialUsers = [] }: UserManagementProps) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return <div className="p-4 text-red-600">Please sign in to access user management.</div>;
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSyncClerkUsers = () => {
    startTransition(async () => {
      const result = await syncClerkUsersToDatabase();

      if (result.success) {
        showMessage('success', result.message || 'Clerk users synced to database');
        // Refresh users list
        const usersResult = await getAllUsers();
        if (usersResult.success) {
          setUsers(usersResult.users);
        }
      } else {
        showMessage('error', result.error || 'Failed to sync Clerk users');
      }
    });
  };

  const refreshUsers = () => {
    startTransition(async () => {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.users);
        showMessage('success', 'Users list refreshed');
      } else {
        showMessage('error', result.error || 'Failed to refresh users');
      }
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage users and sync between Clerk and database</p>
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleSyncClerkUsers}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isPending ? 'Syncing...' : 'Sync Clerk Users to Database'}
          </button>

          <button
            onClick={refreshUsers}
            disabled={isPending}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isPending ? 'Refreshing...' : 'Refresh Users List'}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Information:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• "Sync Clerk Users to Database" creates database records for Clerk users not yet in the database</li>
            <li>• All users have equal access to all features</li>
          </ul>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Users ({users.length})</h2>
        </div>
        
        {users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No users found. Click "Sync Clerk Users to Database" to import users from Clerk.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
