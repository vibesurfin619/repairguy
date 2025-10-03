/**
 * Environment validation for Clerk authentication
 * Ensures all required Clerk environment variables are properly configured
 */

export const REQUIRED_CLERK_ENV_VARS = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
] as const;

export const OPTIONAL_CLERK_ENV_VARS = [
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
  'CLERK_WEBHOOK_SECRET',
] as const;

type ClerkEnvVar = typeof REQUIRED_CLERK_ENV_VARS[number] | typeof OPTIONAL_CLERK_ENV_VARS[number];

interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  configured: Record<string, boolean>;
}

/**
 * Validates that all required Clerk environment variables are set
 */
export function validateClerkEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const configured: Record<string, boolean> = {};

  // Check required environment variables
  for (const envVar of REQUIRED_CLERK_ENV_VARS) {
    const value = process.env[envVar];
    configured[envVar] = !!value;
    
    if (!value) {
      missing.push(envVar);
    }
  }

  // Check optional environment variables and provide warnings
  for (const envVar of OPTIONAL_CLERK_ENV_VARS) {
    const value = process.env[envVar];
    configured[envVar] = !!value;
    
    if (!value) {
      switch (envVar) {
        case 'NEXT_PUBLIC_CLERK_SIGN_IN_URL':
          warnings.push('Consider setting NEXT_PUBLIC_CLERK_SIGN_IN_URL for custom sign-in page');
          break;
        case 'NEXT_PUBLIC_CLERK_SIGN_UP_URL':
          warnings.push('Consider setting NEXT_PUBLIC_CLERK_SIGN_UP_URL for custom sign-up page');
          break;
        case 'CLERK_WEBHOOK_SECRET':
          warnings.push('Set CLERK_WEBHOOK_SECRET if using Clerk webhooks');
          break;
      }
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    configured
  };
}

/**
 * Throws an error if Clerk environment is not properly configured
 * Use this during application startup to fail fast
 */
export function requireValidClerkEnvironment(): void {
  const validation = validateClerkEnvironment();
  
  if (!validation.isValid) {
    const errorMessage = [
      '🚨 CLERK AUTHENTICATION CONFIGURATION ERROR 🚨',
      '',
      'Missing required environment variables:',
      ...validation.missing.map(env => `  - ${env}`),
      '',
      'Please add these variables to your .env.local file:',
      ...validation.missing.map(env => `  ${env}=your_${env.toLowerCase()}_here`),
      '',
      'Visit https://clerk.com/docs/quickstarts/nextjs for setup instructions.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Clerk Configuration Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}

/**
 * Get Clerk configuration summary for debugging
 */
export function getClerkConfigSummary() {
  const validation = validateClerkEnvironment();
  
  return {
    status: validation.isValid ? 'configured' : 'missing_required_vars',
    provider: 'Clerk',
    requiredVars: {
      configured: REQUIRED_CLERK_ENV_VARS.filter(env => validation.configured[env]),
      missing: validation.missing
    },
    optionalVars: {
      configured: OPTIONAL_CLERK_ENV_VARS.filter(env => validation.configured[env]),
      available: OPTIONAL_CLERK_ENV_VARS.filter(env => !validation.configured[env])
    },
    warnings: validation.warnings
  };
}

/**
 * Runtime check for development environment
 * Warns developers about missing Clerk configuration
 */
export function checkClerkConfigInDev() {
  if (process.env.NODE_ENV === 'development') {
    try {
      requireValidClerkEnvironment();
      console.log('✅ Clerk authentication is properly configured');
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Unknown Clerk configuration error');
      process.exit(1);
    }
  }
}
