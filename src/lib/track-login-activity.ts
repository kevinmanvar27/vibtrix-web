import prisma from '@/lib/prisma';
import { getLocationFromIp, parseUserAgent } from './user-agent-parser';
import { createId } from '@paralleldrive/cuid2';
import { NextRequest } from 'next/server';

import debug from "@/lib/debug";

/**
 * Track user login activity
 * @param userId - The ID of the user who logged in
 * @param request - The Next.js request object
 * @param status - The login status (SUCCESS or FAILED)
 */
export async function trackLoginActivity(
  userId: string,
  request: NextRequest,
  status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
): Promise<void> {
  debug.log(`🔍 Tracking login activity for user ${userId} with status ${status}`);

  try {
    // Check if login activity tracking is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { loginActivityTrackingEnabled: true },
    });

    if (!settings?.loginActivityTrackingEnabled) {
      debug.log(`⚠️ Login activity tracking is disabled. Skipping tracking for user ${userId}`);
      return;
    }
    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    debug.log(`📍 IP Address: ${ipAddress}`);

    // Get user agent
    const userAgent = request.headers.get('user-agent');
    debug.log(`🌐 User Agent: ${userAgent?.substring(0, 50)}...`);

    // Parse user agent to get device information
    const deviceInfo = parseUserAgent(userAgent);
    debug.log(`📱 Device Info:`, deviceInfo);

    // Get location information from IP
    const locationInfo = await getLocationFromIp(ipAddress);
    debug.log(`🗺️ Location Info:`, locationInfo);

    // Record login activity in database using Prisma
    debug.log(`💾 Creating login activity record in database...`);

    // Clean the IP address
    const cleanIpAddress = ipAddress.split(',')[0].trim();

    // Use Prisma to create the login activity record
    await prisma.userLoginActivity.create({
      data: {
        id: createId(),
        userId,
        ipAddress: cleanIpAddress,
        userAgent: userAgent || null,
        browser: deviceInfo.browser || null,
        operatingSystem: deviceInfo.operatingSystem || null,
        deviceType: deviceInfo.deviceType || null,
        deviceBrand: deviceInfo.deviceBrand || null,
        deviceModel: deviceInfo.deviceModel || null,
        location: locationInfo.location || null,
        city: locationInfo.city || null,
        region: locationInfo.region || null,
        country: locationInfo.country || null,
        loginAt: new Date(),
        status,
      },
    });

    debug.log(`✅ Login activity recorded successfully`);

    // Verify the record was created
    const count = await prisma.userLoginActivity.count({
      where: { userId },
    });
    debug.log(`📊 Total login activities for user ${userId}: ${count}`);

  } catch (error) {
    // Log error but don't fail the login process
    debug.error('❌ Error tracking login activity:', error);
  }
}
