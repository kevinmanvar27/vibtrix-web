import prisma from "@/lib/prisma";
import crypto from "crypto";

import debug from "@/lib/debug";

// Razorpay API base URL
const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

// Get Razorpay settings from the database or environment variables
export async function getRazorpaySettings() {
  try {
    debug.log("Fetching Razorpay settings...");

    // Use environment variables for test mode
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // If environment variables are set, use them directly (prioritize env vars)
    if (envKeyId && envKeySecret && envKeyId !== 'rzp_test_secure_key_placeholder_2024') {
      debug.log("✅ Using Razorpay settings from environment variables");
      debug.log("Environment variable settings:", {
        keyId: envKeyId.substring(0, 8) + "...",
        keySecret: "[PRESENT]",
        skipValidation: process.env.SKIP_RAZORPAY_VALIDATION
      });

      // Validate environment variable format
      if (!envKeyId.startsWith('rzp_')) {
        debug.error("Invalid Razorpay Key ID format in environment variables");
        throw new Error("Payment system authentication failed. Please contact support.");
      }

      if (envKeySecret.length < 20) {
        debug.error("Invalid Razorpay Key Secret length in environment variables");
        throw new Error("Payment system authentication failed. Please contact support.");
      }

      return {
        keyId: envKeyId,
        keySecret: envKeySecret,
        enabled: true,
        source: "env"
      };
    }

    // If environment variables are not set, fall back to database settings
    debug.log("Environment variables not found, checking database...");

    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        razorpayEnabled: true,
        razorpayKeyId: true,
        razorpayKeySecret: true,
      },
    });

    if (!settings) {
      debug.error("Razorpay settings not found in database");
      throw new Error("Payment system authentication failed. Please contact support.");
    }

    debug.log("Retrieved Razorpay settings from database:", {
      enabled: settings.razorpayEnabled,
      keyId: settings.razorpayKeyId ? settings.razorpayKeyId.substring(0, 8) + "..." : "[MISSING]",
      keySecret: settings.razorpayKeySecret ? "[PRESENT]" : "[MISSING]",
    });

    if (!settings.razorpayEnabled) {
      debug.error("Razorpay is not enabled in settings");
      throw new Error("Payment system authentication failed. Please contact support.");
    }

    if (!settings.razorpayKeyId || !settings.razorpayKeySecret) {
      debug.error("Razorpay API keys are missing in database");
      throw new Error("Payment system authentication failed. Please contact support.");
    }

    // Validate database settings format
    if (!settings.razorpayKeyId.startsWith('rzp_')) {
      debug.error("Invalid Razorpay Key ID format in database");
      throw new Error("Payment system authentication failed. Please contact support.");
    }

    if (settings.razorpayKeySecret.length < 20) {
      debug.error("Invalid Razorpay Key Secret length in database");
      throw new Error("Payment system authentication failed. Please contact support.");
    }

    return {
      keyId: settings.razorpayKeyId,
      keySecret: settings.razorpayKeySecret,
      enabled: settings.razorpayEnabled,
      source: "db"
    };
  } catch (error) {
    debug.error("❌ Error fetching Razorpay settings:", error);
    debug.error("Environment variables:", {
      keyId: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 8) + "..." : "NOT SET",
      keySecret: process.env.RAZORPAY_KEY_SECRET ? "[PRESENT]" : "NOT SET",
      skipValidation: process.env.SKIP_RAZORPAY_VALIDATION
    });

    // If it's already our custom error, re-throw it
    if (error instanceof Error && error.message.includes("Payment system authentication failed")) {
      throw error;
    }
    // Otherwise, throw a generic error
    throw new Error("Payment system authentication failed. Please contact support.");
  }
}

// Validate Razorpay API keys by making a test request
export async function validateRazorpayKeys(keyId: string, keySecret: string) {
  try {
    debug.log("Validating Razorpay API keys...");

    // Basic format validation first
    if (!keyId.startsWith('rzp_')) {
      return {
        valid: false,
        error: "Invalid Key ID format. Must start with 'rzp_'"
      };
    }

    if (keySecret.length < 20) {
      return {
        valid: false,
        error: "Invalid Key Secret length. Must be at least 20 characters"
      };
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // Make a simple request to the payments endpoint which is more reliable for validation
    const response = await fetch(`${RAZORPAY_API_BASE}/payments?count=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000)
    });

    debug.log(`Validation response status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      debug.error("Razorpay API key validation failed: Authentication failed");
      return { valid: false, error: "Authentication failed. Invalid API keys." };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { description: "Unknown API error" } }));

      // If it's a permissions issue but auth worked, keys are still valid
      if (response.status === 403) {
        debug.log("Razorpay API keys are valid (403 indicates valid auth but insufficient permissions for balance endpoint)");
        return { valid: true, error: null };
      }

      // For server errors, still consider keys potentially valid
      if (response.status >= 500) {
        debug.warn("Razorpay API server error, but keys might be valid:", errorData);
        return { valid: true, error: null };
      }

      return {
        valid: false,
        error: `API error (${response.status}): ${errorData.error?.description || "Unknown error"}`
      };
    }

    debug.log("Razorpay API keys validated successfully");
    return { valid: true, error: null };
  } catch (error) {
    debug.error("Error validating Razorpay API keys:", error);

    // Handle timeout errors
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        valid: false,
        error: "Razorpay API request timed out. Please check your internet connection and try again."
      };
    }

    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error validating API keys"
    };
  }
}

// Create a Razorpay order
export async function createRazorpayOrder(amount: number, currency: string = "INR", receipt: string) {
  // Validate receipt length (Razorpay requires <= 40 characters)
  if (receipt.length > 40) {
    debug.error(`Receipt ID too long: ${receipt.length} chars (max: 40);`);
    throw new Error(`Receipt ID exceeds maximum length of 40 characters (${receipt.length})`);
  }
  try {

    const settings = await getRazorpaySettings();
    if (!settings) {
      throw new Error("Razorpay is not properly configured");
    }

    // Validate the API keys before proceeding
    const validation = await validateRazorpayKeys(settings.keyId, settings.keySecret);
    if (!validation.valid) {
      throw new Error(`Razorpay API key validation failed: ${validation.error}`);
    }

    debug.log("Using Razorpay settings:", {
      keyId: settings.keyId,
      keySecret: settings.keySecret ? "[PRESENT]" : "[MISSING]",
      enabled: settings.enabled
    });

    const auth = Buffer.from(`${settings.keyId}:${settings.keySecret}`).toString("base64");

    debug.log("Creating Razorpay order with:", {
      amount: Math.round(amount * 100),
      currency,
      receipt,
    });

    // Ensure amount is properly formatted (integer in paise)
    const amountInPaise = Math.round(amount * 100);

    debug.log(`Making API request to Razorpay with auth: Basic ${auth.substring(0, 10)}...`);

    // Log the request details (without sensitive info)
    debug.log("Razorpay API request details:", {
      url: "https://api.razorpay.com/v1/orders",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic [REDACTED]",
      },
      body: {
        amount: amountInPaise,
        currency,
        receipt,
        notes: {
          source: "Vibtrix",
        },
      },
    });

    // Make the API request
    const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise, // Amount in paise (smallest currency unit)
        currency,
        receipt,
        notes: {
          source: "Vibtrix",
        },
      }),
    });

    debug.log(`Razorpay API response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorData;
      try {
        // Check content type before parsing
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
          debug.error("Razorpay API error details:", JSON.stringify(errorData, null, 2));
        } else {
          // Not JSON, get as text
          const responseText = await response.text();
          debug.error("Razorpay API returned non-JSON response:", responseText);
          debug.error("Response content-type:", contentType);
          errorData = { error: { description: `Non-JSON response: ${responseText}` } };
        }
      } catch (parseError) {
        debug.error("Failed to parse Razorpay error response:", parseError);
        const responseText = await response.text();
        debug.error("Raw response text:", responseText);
        errorData = { error: { description: responseText } };
      }

      // Extract specific error message if available
      const errorMessage = errorData.error?.description ||
        errorData.error?.message ||
        JSON.stringify(errorData);

      // Handle authentication errors specifically
      if (errorMessage.includes("Authentication failed") || response.status === 401) {
        debug.error("Razorpay authentication failed. API keys may be invalid or expired.");
        debug.error("Key ID used:", settings.keyId.substring(0, 8) + "...");
        throw new Error(`Razorpay API authentication failed: ${errorMessage}`);
      }

      // Handle rate limiting errors
      if (response.status === 429 || errorMessage.includes("Too many requests")) {
        debug.error("Razorpay rate limit exceeded. Too many requests.");
        throw new Error(`Razorpay API error: Too many requests`);
      }

      throw new Error(`Razorpay API error: ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    debug.error("Error creating Razorpay order:", error);
    throw error;
  }
}

// Verify Razorpay payment signature
export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
) {
  try {

    // Verify the signature with Razorpay's algorithm
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = generatedSignature === signature;
    debug.log(`Signature verification result: ${isValid ? 'Valid' : 'Invalid'}`);
    return isValid;
  } catch (error) {
    debug.error("Error verifying Razorpay payment:", error);
    return false;
  }
}

// Generate QR code for payment
export async function generateQRCode(orderId: string, amount: number) {
  try {
    debug.log(`Generating QR code for order: ${orderId}`);

    // For testing, we can still use a placeholder QR code if the Razorpay API fails
    // This will be a fallback only

    const settings = await getRazorpaySettings();
    if (!settings) {
      throw new Error("Razorpay is not properly configured");
    }

    const auth = Buffer.from(`${settings.keyId}:${settings.keySecret}`).toString("base64");
    const amountInPaise = Math.round(amount * 100);

    // Create a short customer ID (max 40 chars)
    const customerId = orderId.length > 30 ? orderId.substring(0, 30) : orderId;

    debug.log(`Making QR code API request for amount: ${amountInPaise} paise`);

    const response = await fetch(`${RAZORPAY_API_BASE}/payments/qr_codes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        type: "upi_qr",
        name: "Vibtrix Payment",
        usage: "single_use",
        fixed_amount: true,
        payment_amount: amountInPaise,
        description: `Competition payment`,
        customer_id: customerId,
        close_by: Math.floor(Date.now() / 1000) + 3600, // QR code valid for 1 hour
        notes: {
          order_id: orderId,
        },
      }),
    });

    debug.log(`QR code API response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json();
      debug.error("Razorpay QR API error details:", JSON.stringify(errorData));

      // Extract specific error message if available
      const errorMessage = errorData.error?.description ||
        errorData.error?.message ||
        JSON.stringify(errorData);

      // Handle rate limiting errors
      if (response.status === 429 || errorMessage.includes("Too many requests")) {
        debug.error("Razorpay QR API rate limit exceeded. Too many requests.");
        throw new Error(`Razorpay API error: Too many requests`);
      }

      throw new Error(`Razorpay QR API error: ${errorMessage}`);
    }

    const data = await response.json();
    debug.log("QR code generated successfully");
    return data.image_url;
  } catch (error) {
    debug.error("Error generating QR code:", error);
    // Return a fallback QR code for testing
    debug.log("Using fallback QR code due to API error");
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VibtrixTestPayment_${orderId}_${amount}`;
  }
}
