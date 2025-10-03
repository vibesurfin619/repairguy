import { requireDbUser } from '@/lib/auth';
import { getAllUsers } from '@/actions/users';
import UserManagement from '@/components/UserManagement';
import type { User } from '@/lib/schema';

export default async function UsersPage() {
  // Require authentication to access this page
  await requireDbUser();
  
  // Fetch initial users data
  const usersResult = await getAllUsers();
  const initialUsers = usersResult.success ? usersResult.users : [];

  return (
    <div>
      <UserManagement initialUsers={initialUsers} />
    </div>
  );
}
