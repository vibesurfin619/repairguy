'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SignInButton, SignUpButton, SignOutButton, useUser } from '@clerk/nextjs'
import { useState } from 'react'
import ScanItemModal from '@/components/ScanItemModal'

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser()
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)

  // Debug logging
  console.log('Clerk state:', { isLoaded, isSignedIn, user: user?.id })

  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Image 
            src="/Nok-Main-logo (1).svg" 
            alt="Nok X Away Repairs Logo" 
            width={300} 
            height={150}
            className="mx-auto mb-8"
            priority
          />
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome Back!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Hello, {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || 'User'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl">
                Repair Dashboard
              </button>
            </Link>
            <button 
              onClick={() => setIsScanModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
            >
              Scan Repair Item
            </button>
            <SignOutButton>
              <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
        
        {/* Scan Item Modal */}
        <ScanItemModal 
          isOpen={isScanModalOpen} 
          onClose={() => setIsScanModalOpen(false)} 
        />
      </div>
    )
  }

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Image 
            src="/Nok-Main-logo (1).svg" 
            alt="Nok X Away Repairs Logo" 
            width={300} 
            height={150}
            className="mx-auto mb-8"
            priority
          />
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-12">
            Nok X Away Repairs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <Image 
          src="/Nok-Main-logo (1).svg" 
          alt="Nok X Away Repairs Logo" 
          width={300} 
          height={150}
          className="mx-auto mb-8"
          priority
        />
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-12">
          Nok X Away Repairs
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
            <button className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition duration-300 shadow-lg hover:shadow-xl dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700">
              Sign Up
            </button>
          </SignUpButton>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
          Sign in to access the database dashboard and all repair data
        </p>
      </div>
    </div>
  )
}