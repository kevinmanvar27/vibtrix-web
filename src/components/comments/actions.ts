"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getCommentDataInclude, PostData } from "@/lib/types";
import { createCommentSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export async function submitComment({
  post,
  content,
}: {
  post: PostData;
  content: string;
}) {
  const { user } = await validateRequest();

  if (!user) {
    // Redirect to Google login
    redirect(`/login/google`);
  }

  // Check if comments feature is enabled
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
    select: { commentsEnabled: true },
  });

  if (!settings?.commentsEnabled) {
    throw new Error("Comments feature is currently disabled");
  }

  const { content: contentValidated } = createCommentSchema.parse({ content });

  const [newComment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        content: contentValidated,
        postId: post.id,
        userId: user.id,
      },
      include: getCommentDataInclude(user.id),
    }),
    ...(post.user.id !== user.id
      ? [
        prisma.notification.create({
          data: {
            issuerId: user.id,
            recipientId: post.user.id,
            postId: post.id,
            type: "COMMENT",
          },
        }),
      ]
      : []),
  ]);

  return newComment;
}

export async function deleteComment(id: string) {
  const { user } = await validateRequest();

  if (!user) {
    // Redirect to Google login
    redirect(`/login/google`);
  }

  // Check if comments feature is enabled
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
    select: { commentsEnabled: true },
  });

  if (!settings?.commentsEnabled) {
    throw new Error("Comments feature is currently disabled");
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) throw new Error("Comment not found");

  if (comment.userId !== user.id) throw new Error("Unauthorized");

  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: getCommentDataInclude(user.id),
  });

  return deletedComment;
}
