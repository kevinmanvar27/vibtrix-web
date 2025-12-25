import { createUploadthing, type FileRouter } from "uploadthing/next";
import { validateRequest } from "@/auth";
 
import debug from "@/lib/debug";

const f = createUploadthing();
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique route key
  imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 4 } })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const { user } = await validateRequest();
 
      // If you throw, the user will not be able to upload
      if (!user) throw new Error("Unauthorized");
 
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      debug.log("Upload complete for userId:", metadata.userId);
 
      debug.log("file url", file.url);
 
      // !!! Whatever is returned here is sent to the client !!!
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  videoUploader: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { user } = await validateRequest();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      debug.log("Video upload complete for userId:", metadata.userId);
      debug.log("file url", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  stickerUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { user } = await validateRequest();
      if (!user || !user.isAdmin) throw new Error("Unauthorized - Admin access required");
      return { userId: user.id, isAdmin: user.isAdmin };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      debug.log("Sticker upload complete for admin:", metadata.userId);
      debug.log("file url", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { user } = await validateRequest();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      debug.log("Avatar upload complete for userId:", metadata.userId);
      debug.log("file url", file.url);
      
      // Update user avatar in database
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.user.update({
          where: { id: metadata.userId },
          data: { avatarUrl: file.url }
        });
        
        await prisma.$disconnect();
      } catch (error) {
        debug.error("Error updating user avatar:", error);
      }
      
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
