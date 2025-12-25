import { NextRequest } from "next/server";

// This is a simple health check endpoint to verify API routes are working
export async function GET(request: NextRequest) {
  return Response.json({
    status: "ok",
    message: "API is working",
    timestamp: new Date().toISOString(),
  });
}
