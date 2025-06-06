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
    enabled: false, // Set to true when configured
    config: {
      storageZone: 'your-storage-zone', // Your BunnyCDN storage zone name
      accessKey: '', // Your BunnyCDN access key
      baseUrl: 'https://storage.bunnycdn.com', // BunnyCDN storage API URL
      cdnUrl: 'https://your-storage-zone.b-cdn.net' // CDN URL for serving files
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
        baseUrl: 'https://storage.bunnycdn.com',
        cdnUrl: `https://${import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE}.b-cdn.net`
      }
    };
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

  // Fallback to localStorage
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