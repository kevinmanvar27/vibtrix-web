"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";
import { redirect } from "next/navigation";
import debug from "@/lib/debug";

export async function submitPost(input: {
  content: string;
  mediaIds: string[];
}) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      // Redirect to Google login
      redirect(`/login/google`);
    }

    debug.log(`submitPost: Validating input - content length: ${input.content?.length || 0}, mediaIds: ${input.mediaIds?.length || 0}`);

    // Validate input
    const validationResult = createPostSchema.safeParse(input);
    
    if (!validationResult.success) {
      debug.error('submitPost: Validation failed:', validationResult.error.flatten());
      throw new Error(`Validation failed: ${validationResult.error.errors[0]?.message || 'Invalid input'}`);
    }

    const { content, mediaIds } = validationResult.data;

    debug.log(`submitPost: Creating post for user ${user.id}`);

    const newPost = await prisma.post.create({
      data: {
        content,
        userId: user.id,
        attachments: {
          connect: mediaIds.map((id) => ({ id })),
        },
      },
      include: getPostDataInclude(user.id),
    });

    debug.log(`submitPost: Post created successfully with id ${newPost.id}`);

    // Serialize the post data to ensure it's JSON-serializable for Server Actions
    return JSON.parse(JSON.stringify(newPost));
  } catch (error) {
    debug.error('submitPost: Error creating post:', error);
    throw error;
  }
}
