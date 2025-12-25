"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteAllPosts } from "../bulk-actions";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

import debug from "@/lib/debug";

export default function BulkDeletePostsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [result, setResult] = useState<{
    postsDeleted?: number;
    mediaFilesDeleted?: number;
    competitionEntriesUpdated?: number;
    errors?: string[];
  } | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== "DELETE ALL POSTS") {
      toast({
        variant: "destructive",
        title: "Confirmation failed",
        description: "Please type 'DELETE ALL POSTS' to confirm this action.",
      });
      return;
    }

    setIsDeleting(true);
    setResult(null);

    try {
      const stats = await deleteAllPosts();
      setResult(stats);
      
      toast({
        title: "Deletion completed",
        description: `Successfully deleted ${stats.postsDeleted} posts and ${stats.mediaFilesDeleted} media files.`,
      });
    } catch (error) {
      debug.error("Error deleting posts:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      
      setResult({
        errors: [error instanceof Error ? error.message : "An unknown error occurred"],
      });
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Link>
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Bulk Delete All Posts</h1>
      
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning: Destructive Action</AlertTitle>
        <AlertDescription>
          This action will permanently delete ALL user posts and their associated media files.
          This cannot be undone. Please proceed with extreme caution.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Delete All Posts</CardTitle>
          <CardDescription>
            This will remove all posts from the database and delete all associated media files.
            Competition entries will be preserved but will have their post references removed.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-2">
              Type &quot;DELETE ALL POSTS&quot; to confirm:
            </label>
            <input
              id="confirm"
              type="text"
              className="w-full p-2 border rounded-md"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE ALL POSTS"
              disabled={isDeleting}
            />
          </div>
          
          {result && (
            <div className="mt-4 p-4 border rounded-md bg-muted">
              <h3 className="font-medium mb-2">Results:</h3>
              <ul className="space-y-1 text-sm">
                {result.postsDeleted !== undefined && (
                  <li>Posts deleted: {result.postsDeleted}</li>
                )}
                {result.mediaFilesDeleted !== undefined && (
                  <li>Media files deleted: {result.mediaFilesDeleted}</li>
                )}
                {result.competitionEntriesUpdated !== undefined && (
                  <li>Competition entries updated: {result.competitionEntriesUpdated}</li>
                )}
              </ul>
              
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-destructive mb-2">Errors:</h4>
                  <ul className="space-y-1 text-sm text-destructive">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== "DELETE ALL POSTS"}
            className="w-full"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Posts
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
