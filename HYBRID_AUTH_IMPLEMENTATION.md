# Hybrid Authentication Implementation

This document describes the hybrid authentication approach implemented in RepairGuy, which combines Clerk authentication with database-stored roles for optimal performance and consistency.

## Overview

The hybrid approach provides:
- **Fast role checks** by querying the database first
- **Fallback to Clerk metadata** for users not yet synced to the database
- **Consistent role management** through database storage
- **Automatic synchronization** between Clerk and database

## Architecture

### Database-First Role Checking
1. Check user role in database (fast)
2. If not found, fall back to Clerk metadata
3. Sync user to database on first access

### Role Storage
- **Primary**: Database (`users.role` field)
- **Secondary**: Clerk public metadata (`roles` array)
- **Sync**: Automatic bidirectional sync

## Implementation Details

### Auth Utilities (`src/lib/auth.ts`)

#### New Functions
- `getDbUser(clerkId)` - Get user from database by Clerk ID
- `getCurrentDbUser()` - Get current authenticated user from database
- `hasRole(role)` - Check role (database first, Clerk fallback)
- `requireRoleDbUser(role)` - Require role and return database user
- `syncUserRole()` - Sync user between database and Clerk
- `updateUserRole()` - Update role in database

#### Updated Functions
- `hasRole()` - Now checks database first, then Clerk metadata
- `requireRole()` - Returns database user if available

### Server Actions (`src/actions/users.ts`)

#### User Management Actions
- `updateUserRoleAction()` - Update single user role
- `syncAllUsersToRole()` - Bulk update all users to specific role
- `syncClerkUsersToDatabase()` - Import Clerk users to database
- `getAllUsers()` - Get all users with roles

### API Wrapper (`src/lib/auth-api.ts`)

#### Updated `withRole()` Function
- Checks database first for role
- Falls back to Clerk metadata if user not in database
- Provides detailed error messages with user role information

## Usage Examples

### Server Components
```typescript
import { requireRoleDbUser, hasRole } from '@/lib/auth';

// Require specific role and get database user
export default async function AdminPage() {
  const user = await requireRoleDbUser('ADMIN');
  // user is guaranteed to be in database with ADMIN role
}

// Check role without throwing
export default async function SomePage() {
  const isAdmin = await hasRole('ADMIN');
  // Fast database check, Clerk fallback
}
```

### Client Components
```typescript
'use client';
import { useUser } from '@clerk/nextjs';
import { updateUserRoleAction } from '@/actions/users';

export default function UserManagement() {
  const { user } = useUser();
  
  const handleRoleUpdate = async (clerkId: string, newRole: string) => {
    const result = await updateUserRoleAction({ clerkId, role: newRole });
    // Updates both database and Clerk metadata
  };
}
```

### API Routes
```typescript
import { withRole } from '@/lib/auth-api';

export const GET = withRole('ADMIN', async (req, { userId }) => {
  // userId is guaranteed to have ADMIN role
  // Checked against database first, Clerk fallback
});
```

## User Management UI

### Admin Interface (`src/components/UserManagement.tsx`)
- View all users with roles
- Update individual user roles
- Bulk sync all users to technicians
- Import Clerk users to database
- Real-time role updates

### Admin Page (`src/app/dashboard/users/page.tsx`)
- Protected by `requireRoleDbUser('ADMIN')`
- Displays user management interface
- Server-side data fetching

## Synchronization Scripts

### Manual Sync Script (`scripts/sync-users-to-technicians.ts`)
```bash
npm run sync-users
```

This script:
1. Fetches all users from Clerk
2. Creates database records for missing users
3. Updates existing users to TECHNICIAN role
4. Updates Clerk metadata to match database
5. Provides detailed progress and results

### Features
- Batch processing of users
- Error handling and reporting
- Progress tracking
- Detailed logging

## Migration Strategy

### Phase 1: Database Setup
1. Ensure `users` table exists with `role` field
2. Default role is `TECHNICIAN`

### Phase 2: Auth Update
1. Update auth utilities to use hybrid approach
2. Update API wrappers to check database first
3. Maintain backward compatibility with Clerk metadata

### Phase 3: User Sync
1. Run sync script to import Clerk users
2. Update all users to TECHNICIAN role
3. Verify Clerk metadata synchronization

### Phase 4: Admin Interface
1. Deploy user management UI
2. Test role updates
3. Verify bidirectional sync

## Security Considerations

### Access Control
- Only ADMIN users can manage roles
- All role changes are logged
- Database is the source of truth

### Data Consistency
- Database roles take precedence
- Clerk metadata is kept in sync
- Fallback ensures no access loss

### Error Handling
- Graceful degradation if database unavailable
- Detailed error messages for debugging
- Audit trail for role changes

## Best Practices

### Role Management
1. Always use database as primary source
2. Keep Clerk metadata in sync
3. Use admin interface for role changes
4. Monitor sync status

### Performance
1. Database queries are fast and cached
2. Clerk metadata is fallback only
3. Batch operations for bulk updates
4. Minimal API calls

### Maintenance
1. Regular sync verification
2. Monitor for sync failures
3. Backup role data
4. Update documentation

## Troubleshooting

### Common Issues

#### User Not Found in Database
- Run sync script to import Clerk users
- Check database connection
- Verify user exists in Clerk

#### Role Mismatch
- Check database role first
- Verify Clerk metadata sync
- Use admin interface to update

#### Sync Failures
- Check Clerk API limits
- Verify database permissions
- Review error logs

### Debug Commands
```bash
# Check database users
npm run db:studio

# Sync users manually
npm run sync-users

# Check Clerk users
# Use Clerk Dashboard or API
```

## Future Enhancements

### Planned Features
- Automatic webhook sync
- Role change notifications
- Audit logging
- Bulk role operations
- Role templates

### Performance Improvements
- Database query optimization
- Caching layer
- Background sync jobs
- Real-time updates

## Conclusion

The hybrid authentication approach provides the best of both worlds:
- Fast database queries for role checks
- Reliable Clerk integration for authentication
- Consistent role management across systems
- Easy migration and maintenance

This implementation ensures that RepairGuy has robust, scalable, and maintainable user role management while staying compatible with Clerk's authentication system.
