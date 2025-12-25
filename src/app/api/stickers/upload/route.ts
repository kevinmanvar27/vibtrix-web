import { validateRequest } from "@/auth";
import { storeSticker } from "@/lib/fileStorage";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function POST(req: NextRequest) {
  try {
    // Validate user authentication
    const { user } = await validateRequest();
    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the request is multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return Response.json(
        { error: "Content type must be multipart/form-data" },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }



    // Check file type
    const fileType = file.type;
    if (!fileType.startsWith("image/")) {
      return Response.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Store the sticker
    debug.log(`Direct sticker upload: Processing file ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    const stickerUrl = await storeSticker(buffer, file.name);
    debug.log(`Direct sticker upload: Sticker stored at ${stickerUrl}`);

    // Return the URL
    return Response.json({ success: true, stickerUrl });
  } catch (error) {
    debug.error("Error uploading sticker:", error);
    return Response.json(
      { error: "Failed to upload sticker" },
      { status: 500 }
    );
  }
}
