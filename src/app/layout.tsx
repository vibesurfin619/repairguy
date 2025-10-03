import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { checkClerkConfigInDev } from '@/lib/env-validation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Validate Clerk configuration in development
if (process.env.NODE_ENV === 'development') {
  checkClerkConfigInDev()
}

export const metadata: Metadata = {
  title: 'RepairGuy - Your Trusted Repair Service',
  description: 'Professional repair services for all your needs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className} suppressHydrationWarning>
          {/* Clerk authentication is enforced application-wide */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
