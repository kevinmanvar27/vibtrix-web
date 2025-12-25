import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getLocationFromIp, parseUserAgent } from './user-agent-parser';
import { secureRawQuery } from '@/lib/sql-security';

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

    // Record login activity in database using raw SQL query
    debug.log(`💾 Creating login activity record in database using raw SQL...`);

    // Clean the IP address
    const cleanIpAddress = ipAddress.split(',')[0].trim();

    // Use a secure raw SQL query to insert the login activity
    const insertQuery = `
      INSERT INTO user_login_activities (
        id,
        "userId",
        "ipAddress",
        "userAgent",
        browser,
        "operatingSystem",
        "deviceType",
        "deviceBrand",
        "deviceModel",
        location,
        city,
        region,
        country,
        "loginAt",
        status
      )
      VALUES (
        gen_random_uuid()::text,
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13
      )
    `;

    const params = [
      userId,
      cleanIpAddress,
      userAgent || null,
      deviceInfo.browser || null,
      deviceInfo.operatingSystem || null,
      deviceInfo.deviceType || null,
      deviceInfo.deviceBrand || null,
      deviceInfo.deviceModel || null,
      locationInfo.location || null,
      locationInfo.city || null,
      locationInfo.region || null,
      locationInfo.country || null,
      status
    ];

    const secureQuery = secureRawQuery(insertQuery, params);
    const result = await prisma.$executeRawUnsafe(secureQuery.query, ...secureQuery.params);

    debug.log(`✅ Login activity recorded successfully, result:`, result);

    // Verify the record was created using secure raw SQL
    const countQuery = `SELECT COUNT(*) as count FROM user_login_activities WHERE "userId" = $1`;
    const secureCountQuery = secureRawQuery(countQuery, [userId]);
    const countResult = await prisma.$queryRawUnsafe(secureCountQuery.query, ...secureCountQuery.params);
    const count = countResult[0]?.count || 0;
    debug.log(`📊 Total login activities for user ${userId}: ${count}`);

  } catch (error) {
    // Log error but don't fail the login process
    debug.error('❌ Error tracking login activity:', error);
  }
}
