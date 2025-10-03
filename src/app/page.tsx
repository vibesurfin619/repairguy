'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import { useState } from 'react'
import ScanItemModal from '@/components/ScanItemModal'

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser()
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)

  // Debug logging
  console.log('Clerk state:', { isLoaded, isSignedIn, user: user?.id })

  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Image 
            src="/Away_Logo.png" 
            alt="Away Logo" 
            width={300} 
            height={150}
            className="mx-auto mb-8"
            priority
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Repairs Management
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            You are logged in as {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || 'User'}
          </p>
          
          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            {/* Repair Dashboard Card */}
            <Link href="/dashboard" className="group">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center border border-gray-100 hover:border-blue-200 hover:-translate-y-1 h-48">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Repair Dashboard</h3>
                <p className="text-gray-600 text-sm">View and manage all repair operations</p>
              </div>
            </Link>

            {/* Scan Repair Item Card */}
            <button 
              onClick={() => setIsScanModalOpen(true)}
              className="group"
            >
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center border border-gray-100 hover:border-green-200 hover:-translate-y-1 h-48">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors duration-300">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Scan Repair Item</h3>
                <p className="text-gray-600 text-sm">Start a new repair session</p>
              </div>
            </button>

            {/* Manage Workflows Card */}
            <Link href="/dashboard/workflows" className="group">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center border border-gray-100 hover:border-purple-200 hover:-translate-y-1 h-48">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors duration-300">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Manage Workflows</h3>
                <p className="text-gray-600 text-sm">Create and configure repair workflows</p>
              </div>
            </Link>
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Image 
            src="/Away_Logo.png" 
            alt="Away Logo" 
            width={300} 
            height={150}
            className="mx-auto mb-8"
            priority
          />
          <h1 className="text-6xl font-bold text-gray-900 mb-12">
            Nok X Away Repairs
          </h1>
          <p className="text-lg text-gray-600">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Image 
          src="/Away_Logo.png" 
          alt="Away Logo" 
          width={100} 
          height={50}
          className="mx-auto mb-8"
          priority
        />
        <h1 className="text-6xl font-bold text-gray-900 mb-12">
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
        
        <p className="text-sm text-gray-500 mt-8">
          Sign in to access the database dashboard and all repair data
        </p>
      </div>
    </div>
  )
}