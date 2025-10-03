'use client'

import { useUser } from '@clerk/nextjs'

export default function TestClerk() {
  const { isSignedIn, user, isLoaded } = useUser()

  console.log('Clerk test state:', { isLoaded, isSignedIn, user: user?.id })

  if (!isLoaded) {
    return <div>Loading Clerk...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clerk Test Page</h1>
      <div className="space-y-2">
        <p><strong>isLoaded:</strong> {isLoaded ? 'true' : 'false'}</p>
        <p><strong>isSignedIn:</strong> {isSignedIn ? 'true' : 'false'}</p>
        <p><strong>User ID:</strong> {user?.id || 'None'}</p>
        <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'None'}</p>
      </div>
    </div>
  )
}

