/**
 * External Hosting Configuration for Vision Boards
 * Supports Hostinger, BunnyCDN, and other hosting providers
 */

export interface HostingConfig {
  provider: 'hostinger' | 'bunnycdn' | 'localStorage';
  enabled: boolean;
  config: any;
}

export const HOSTING_CONFIGS: Record<string, HostingConfig> = {
  // Hostinger Configuration
  hostinger: {
    provider: 'hostinger',
    enabled: false, // Set to true when configured
    config: {
      apiEndpoint: 'https://your-hostinger-domain.com/api/upload',
      authToken: '', // Add your Hostinger API token
      directory: 'vision-boards',
      baseUrl: 'https://your-hostinger-domain.com/uploads'
    }
  },

  // BunnyCDN Configuration  
  bunnycdn: {
    provider: 'bunnycdn',
    enabled: true, // Enabled with proper configuration
    config: {
      storageZone: 'visionboard', // BunnyCDN storage zone name
      accessKey: '71b084b5-28b6-41a0-a6da725f3453-1318-4cbb', // BunnyCDN access key
      baseUrl: 'https://ny.storage.bunnycdn.com', // NY region storage API URL
      cdnUrl: 'https://visionboard.b-cdn.net' // CDN URL for serving files
    }
  },

  // Fallback to localStorage
  localStorage: {
    provider: 'localStorage',
    enabled: true,
    config: {}
  }
};

/**
 * Get active hosting configuration
 */
export function getActiveHostingConfig(): HostingConfig {
  // Check for environment variables first
  if (import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE && import.meta.env.VITE_BUNNYCDN_ACCESS_KEY) {
    return {
      provider: 'bunnycdn',
      enabled: true,
      config: {
        storageZone: import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE,
        accessKey: import.meta.env.VITE_BUNNYCDN_ACCESS_KEY,
        baseUrl: 'https://ny.storage.bunnycdn.com',
        cdnUrl: `https://${import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE}.b-cdn.net`
      }
    };
  }

  // Use hardcoded BunnyCDN configuration
  if (HOSTING_CONFIGS.bunnycdn.enabled) {
    return HOSTING_CONFIGS.bunnycdn;
  }

  if (import.meta.env.VITE_HOSTINGER_API_ENDPOINT && import.meta.env.VITE_HOSTINGER_AUTH_TOKEN) {
    return {
      provider: 'hostinger',
      enabled: true,
      config: {
        apiEndpoint: import.meta.env.VITE_HOSTINGER_API_ENDPOINT,
        authToken: import.meta.env.VITE_HOSTINGER_AUTH_TOKEN,
        directory: import.meta.env.VITE_HOSTINGER_DIRECTORY || 'vision-boards',
        baseUrl: import.meta.env.VITE_HOSTINGER_BASE_URL
      }
    };
  }

  // Fallback to localStorage only as last resort
  return HOSTING_CONFIGS.localStorage;
}

/**
 * Bandwidth impact estimation
 */
export function estimateBandwidthImpact(monthlyUsers: number, visionBoardsPerUser: number, avgSizeKB: number) {
  const totalFiles = monthlyUsers * visionBoardsPerUser;
  const totalSizeGB = (totalFiles * avgSizeKB) / 1024 / 1024;
  
  return {
    totalFiles,
    totalSizeGB: Number(totalSizeGB.toFixed(2)),
    estimatedCost: {
      bunnycdn: Number((totalSizeGB * 0.01).toFixed(2)), // $0.01 per GB
      hostinger: Number((totalSizeGB * 0.02).toFixed(2)), // Estimated $0.02 per GB
      replit: Number((totalSizeGB * 0.10).toFixed(2)) // Higher cost estimate for Replit database
    },
    recommendation: totalSizeGB > 1 ? 'Use external CDN (BunnyCDN recommended)' : 'Current infrastructure acceptable'
  };
}