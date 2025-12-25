import debug from "@/lib/debug";

/**
 * Utility functions for parsing user agent information
 */

interface DeviceInfo {
  browser?: string;
  operatingSystem?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
}

/**
 * Parse user agent string to extract device information
 * @param userAgent - The user agent string from the request
 * @returns Object containing parsed device information
 */
export function parseUserAgent(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {};
  }

  const info: DeviceInfo = {};

  // Extract browser information
  if (userAgent.includes('Firefox/')) {
    info.browser = 'Firefox';
  } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/') && !userAgent.includes('OPR/')) {
    info.browser = 'Chrome';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    info.browser = 'Safari';
  } else if (userAgent.includes('Edg/')) {
    info.browser = 'Edge';
  } else if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
    info.browser = 'Opera';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
    info.browser = 'Internet Explorer';
  } else {
    info.browser = 'Unknown';
  }

  // Extract operating system information
  if (userAgent.includes('Windows')) {
    info.operatingSystem = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    info.operatingSystem = 'macOS';
  } else if (userAgent.includes('Linux')) {
    info.operatingSystem = 'Linux';
  } else if (userAgent.includes('Android')) {
    info.operatingSystem = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    info.operatingSystem = 'iOS';
  } else {
    info.operatingSystem = 'Unknown';
  }

  // Determine device type
  if (userAgent.includes('Mobile') || userAgent.includes('Android') && userAgent.includes('AppleWebKit')) {
    info.deviceType = 'Mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    info.deviceType = 'Tablet';
  } else {
    info.deviceType = 'Desktop';
  }

  // Extract device brand and model (simplified)
  if (userAgent.includes('iPhone')) {
    info.deviceBrand = 'Apple';
    // Extract iPhone model
    const iPhoneMatch = userAgent.match(/iPhone\s*(?:OS\s*)?(\d+)/i);
    info.deviceModel = iPhoneMatch ? `iPhone ${iPhoneMatch[1]}` : 'iPhone';
  } else if (userAgent.includes('iPad')) {
    info.deviceBrand = 'Apple';
    info.deviceModel = 'iPad';
  } else if (userAgent.includes('Macintosh')) {
    info.deviceBrand = 'Apple';
    info.deviceModel = 'Mac';
  } else if (userAgent.includes('Samsung') || userAgent.includes('SM-')) {
    info.deviceBrand = 'Samsung';
    const samsungMatch = userAgent.match(/SM-[A-Z0-9]+/i);
    info.deviceModel = samsungMatch ? samsungMatch[0] : 'Galaxy';
  } else if (userAgent.includes('Pixel')) {
    info.deviceBrand = 'Google';
    const pixelMatch = userAgent.match(/Pixel\s*(\d+)/i);
    info.deviceModel = pixelMatch ? `Pixel ${pixelMatch[1]}` : 'Pixel';
  } else if (userAgent.includes('OnePlus')) {
    info.deviceBrand = 'OnePlus';
    const onePlusMatch = userAgent.match(/OnePlus\s*(\w+)/i);
    info.deviceModel = onePlusMatch ? `OnePlus ${onePlusMatch[1]}` : 'OnePlus';
  } else if (userAgent.includes('Xiaomi') || userAgent.includes('MI ') || userAgent.includes('Redmi')) {
    info.deviceBrand = 'Xiaomi';
    if (userAgent.includes('Redmi')) {
      const redmiMatch = userAgent.match(/Redmi\s*(\w+)/i);
      info.deviceModel = redmiMatch ? `Redmi ${redmiMatch[1]}` : 'Redmi';
    } else {
      const miMatch = userAgent.match(/MI\s*(\w+)/i);
      info.deviceModel = miMatch ? `MI ${miMatch[1]}` : 'MI';
    }
  } else {
    info.deviceBrand = 'Unknown';
    info.deviceModel = 'Unknown';
  }

  return info;
}

/**
 * Get location information from IP address
 * This is a placeholder function that would typically call a geolocation API
 * @param ipAddress - The IP address to look up
 * @returns Promise resolving to location information
 */
export async function getLocationFromIp(ipAddress: string | null): Promise<{
  location?: string;
  city?: string;
  region?: string;
  country?: string;
}> {
  // For local or unknown IPs, provide a default location
  if (!ipAddress || ipAddress === 'unknown' || ipAddress === '127.0.0.1' || ipAddress === '::1') {
    return {
      location: 'Local Network',
      city: 'Local',
      region: 'Local',
      country: 'Local'
    };
  }

  // For simplicity, we'll use a basic approach to determine location
  // In a production environment, you would use a proper geolocation API
  try {
    // For demonstration purposes, we'll return more meaningful placeholder data
    // based on common IP patterns (this is not accurate but better than 'Unknown')

    // Extract first octet of IP address to make a basic guess
    const firstOctet = parseInt(ipAddress.split('.')[0]);

    if (firstOctet >= 1 && firstOctet <= 126) {
      return {
        location: 'North America',
        city: 'Unknown City',
        region: 'Unknown Region',
        country: 'United States'
      };
    } else if (firstOctet >= 128 && firstOctet <= 191) {
      return {
        location: 'Europe',
        city: 'Unknown City',
        region: 'Unknown Region',
        country: 'United Kingdom'
      };
    } else if (firstOctet >= 192 && firstOctet <= 223) {
      return {
        location: 'Asia Pacific',
        city: 'Unknown City',
        region: 'Unknown Region',
        country: 'India'
      };
    } else {
      return {
        location: 'Global',
        city: 'Unknown City',
        region: 'Unknown Region',
        country: 'Unknown Country'
      };
    }

    // In a real implementation, you would parse the API response:
    // return {
    //   location: `${response.city}, ${response.country_name}`,
    //   city: response.city,
    //   region: response.region,
    //   country: response.country_name
    // };
  } catch (error) {
    debug.error('Error getting location from IP:', error);
    return {
      location: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      country: 'Unknown'
    };
  }
}
