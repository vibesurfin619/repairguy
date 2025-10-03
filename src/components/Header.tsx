'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useState } from 'react';

export function Header() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/Nok-Main-logo (1).svg" 
              alt="Nok X Away Repairs Logo" 
              width={120} 
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Navigation Menu */}
          <div className="flex items-center space-x-4">
            {isLoaded && isSignedIn ? (
              <>
                {/* Desktop Menu */}
                <nav className="hidden md:flex items-center space-x-6">
                  <Link 
                    href="/" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                  >
                    Home
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                  <SignOutButton>
                    <button className="text-gray-700 hover:text-red-600 font-medium transition-colors duration-200">
                      Sign Out
                    </button>
                  </SignOutButton>
                </nav>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Toggle menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              /* Sign In Button for non-authenticated users */
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Home
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isLoaded && isSignedIn && isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <SignOutButton>
                <button 
                  className="text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 px-2 py-1 text-left"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Out
                </button>
              </SignOutButton>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
