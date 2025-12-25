import { validateRequest } from "@/auth";
import Post from "@/components/posts/Post";
import prisma from "@/lib/prisma";
import { getPostDataInclude, UserData } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import UserInfoSidebarClient from "./UserInfoSidebarClient";

interface PageProps {
  params: { postId: string };
}

const getPost = cache(async (postId: string, loggedInUserId: string) => {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    include: getPostDataInclude(loggedInUserId),
  });

  if (!post) notFound();

  return post;
});

export async function generateMetadata({
  params: { postId },
}: PageProps): Promise<Metadata> {
  const { user } = await validateRequest();
  const isLoggedIn = !!user;

  // Get post data for both logged-in and guest users
  const post = await getPost(postId, isLoggedIn ? user.id : '');

  return {
    title: `${post.user.displayName}: ${post.content.slice(0, 50)}...`,
  };
}

export default async function Page({ params: { postId } }: PageProps) {
  const { user } = await validateRequest();
  const isLoggedIn = !!user;

  // Get post data for both logged-in and guest users
  const post = await getPost(postId, isLoggedIn ? user.id : '');

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <Post post={post} />
      </div>
      <div className="sticky top-[5.25rem] hidden h-fit w-80 flex-none lg:block">
        <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
          <UserInfoSidebarClient
            user={post.user}
            loggedInUser={user}
            isLoggedIn={isLoggedIn}
          />
        </Suspense>
      </div>
    </main>
  );
}


