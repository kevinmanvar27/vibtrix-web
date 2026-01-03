"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Eye, MoreHorizontal, Trash, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MediaType } from "@prisma/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { deletePost, disablePost } from "../actions";
import { useRouter, useSearchParams } from "next/navigation";

import debug from "@/lib/debug";

type Post = {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  attachments: {
    id: string;
    type: MediaType;
    url: string;
  }[];
  _count: {
    likes: number;
    comments: number;
  };
};

/**
 * Pagination info for the table
 */
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface PostTableProps {
  posts: Post[];
  pagination?: PaginationInfo;
}

export default function PostTable({ posts, pagination }: PostTableProps) {
  const [processingPostId, setProcessingPostId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/admin/posts?${params.toString()}`);
  };

  const handleDisablePost = async (postId: string) => {
    setProcessingPostId(postId);
    try {
      await disablePost(postId);
      toast({
        title: "Post disabled",
        description: "The post has been disabled successfully.",
      });
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: "Failed to disable post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPostId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }
    
    setProcessingPostId(postId);
    try {
      await deletePost(postId);
      toast({
        title: "Post deleted",
        description: "The post has been deleted successfully.",
      });
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPostId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No posts found
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    <div className="max-w-xs truncate">{post.content}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.user.avatarUrl || undefined} alt={post.user.displayName} />
                        <AvatarFallback>
                          {post.user.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>@{post.user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.attachments.length > 0 ? (
                      <div className="flex gap-1">
                        {post.attachments.map((attachment) => (
                          <span key={attachment.id} className="rounded bg-muted px-1 py-0.5 text-xs">
                            {attachment.type}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Text only</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-3 text-muted-foreground text-sm">
                      <span>{post._count.likes} likes</span>
                      <span>{post._count.comments} comments</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={processingPostId === post.id}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/posts/${post.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDisablePost(post.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Disable Post
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeletePost(post.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
