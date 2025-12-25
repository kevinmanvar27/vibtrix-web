"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import debug from "@/lib/debug";

interface FixCompetitionEntriesButtonProps {
  competitionId: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
}

// Create a component that uses the useQueryClient hook
function FixCompetitionEntriesButtonInner({
  competitionId,
  variant = "outline",
  size = "sm",
  className = "",
  onSuccess,
}: FixCompetitionEntriesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRebuild = async () => {
    if (isRebuilding) return;

    setIsRebuilding(true);
    setResults(null);

    try {
      const response = await apiClient.post(`/api/competitions/${competitionId}/manage-entries`, { action: "rebuild-entries" });

      // Invalidate all competition-related queries
      queryClient.invalidateQueries({ queryKey: ["competition-feed"] });

      setResults(response.data);

      toast({
        title: "Entries rebuilt successfully",
        description: `All competition entries have been rebuilt. ${response.data?.results?.length || 0} entries processed.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      debug.error("Error rebuilding entries:", error);
      toast({
        variant: "destructive",
        title: "Rebuild failed",
        description: error instanceof Error ? error.message : "Failed to rebuild competition entries",
      });
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setResults(null);

    try {
      const response = await apiClient.post(`/api/competitions/${competitionId}/manage-entries`, { action: "sync-entries" });

      // Invalidate all competition-related queries
      queryClient.invalidateQueries({ queryKey: ["competition-feed"] });

      setResults(response.data);

      toast({
        title: "Entries synchronized successfully",
        description: `All competition entries have been synchronized. ${response.data?.results?.length || 0} entries processed.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      debug.error("Error synchronizing entries:", error);
      toast({
        variant: "destructive",
        title: "Synchronization failed",
        description: error instanceof Error ? error.message : "Failed to synchronize competition entries",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Force reload the page to ensure all data is refreshed
    window.location.reload();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Wrench className="h-4 w-4 mr-2" />
        Fix Entries
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fix Competition Entries</DialogTitle>
            <DialogDescription>
              Use these tools to fix issues with competition entries. The "Rebuild Entries" option is more aggressive and will completely rebuild all entries, while "Sync Round Entries" will only update visibility flags.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="rebuild" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rebuild">Rebuild Entries</TabsTrigger>
              <TabsTrigger value="sync">Sync Round Entries</TabsTrigger>
            </TabsList>

            <TabsContent value="rebuild" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>This will completely rebuild all competition entries. It will:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Preserve existing posts for each round</li>
                  <li>Ensure each round has the correct post</li>
                  <li>Fix visibility flags for all entries</li>
                </ul>
              </div>

              <Button
                onClick={handleRebuild}
                disabled={isRebuilding}
                className="w-full"
              >
                {isRebuilding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rebuilding Entries...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Rebuild All Entries
                  </>
                )}
              </Button>

              {isRebuilding && (
                <div className="text-sm text-muted-foreground text-center">
                  This may take a few moments...
                </div>
              )}

              {results && results.results && (
                <div className="border rounded-md p-4 mt-4 bg-muted/30">
                  <h3 className="font-medium mb-2">Results</h3>
                  <p className="text-sm mb-2">Processed {results.results.length} entries</p>

                  <div className="text-xs space-y-1 max-h-[300px] overflow-y-auto">
                    {results.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${
                          result.status === "preserved" ? "bg-blue-50 dark:bg-blue-950/30" :
                          result.status === "updated" ? "bg-green-50 dark:bg-green-950/30" :
                          result.status === "created" ? "bg-purple-50 dark:bg-purple-950/30" :
                          result.status === "created-with-fallback" ? "bg-yellow-50 dark:bg-yellow-950/30" :
                          result.status === "error" ? "bg-red-50 dark:bg-red-950/30" :
                          "bg-gray-50 dark:bg-gray-950/30"
                        }`}
                      >
                        <span className="font-medium">
                          {result.status === "preserved" ? "Preserved" :
                           result.status === "updated" ? "Updated" :
                           result.status === "created" ? "Created" :
                           result.status === "created-with-fallback" ? "Created (fallback)" :
                           result.status === "error" ? "Error" :
                           result.status === "skipped" ? "Skipped" :
                           result.status}
                        </span>
                        {result.roundName && (
                          <span className="ml-1">
                            round "{result.roundName}"
                          </span>
                        )}
                        {result.postId && (
                          <span className="text-muted-foreground ml-1">
                            with post {result.postId.substring(0, 8)}...
                          </span>
                        )}
                        {result.error && (
                          <span className="text-red-500 ml-1">
                            Error: {result.error}
                          </span>
                        )}
                        {result.reason && (
                          <span className="text-muted-foreground ml-1">
                            Reason: {result.reason}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>This will synchronize all competition entries. It will:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Ensure all entries have correct visibility flags</li>
                  <li>Fix entries that are missing posts</li>
                  <li>Preserve existing posts for each round</li>
                </ul>
              </div>

              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Synchronizing Entries...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Synchronize All Entries
                  </>
                )}
              </Button>

              {isSyncing && (
                <div className="text-sm text-muted-foreground text-center">
                  This may take a few moments...
                </div>
              )}

              {results && results.results && (
                <div className="border rounded-md p-4 mt-4 bg-muted/30">
                  <h3 className="font-medium mb-2">Results</h3>
                  <p className="text-sm mb-2">Processed {results.results.length} entries</p>

                  <div className="text-xs space-y-1 max-h-[300px] overflow-y-auto">
                    {results.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${
                          result.status === "visibility-updated" ? "bg-blue-50 dark:bg-blue-950/30" :
                          result.status === "updated" ? "bg-green-50 dark:bg-green-950/30" :
                          result.status === "error" ? "bg-red-50 dark:bg-red-950/30" :
                          "bg-gray-50 dark:bg-gray-950/30"
                        }`}
                      >
                        <span className="font-medium">
                          {result.status === "visibility-updated" ? "Visibility Updated" :
                           result.status === "updated" ? "Updated" :
                           result.status === "error" ? "Error" :
                           result.status}
                        </span>
                        {result.roundName && (
                          <span className="ml-1">
                            round "{result.roundName}"
                          </span>
                        )}
                        {result.postId && (
                          <span className="text-muted-foreground ml-1">
                            with post {result.postId.substring(0, 8)}...
                          </span>
                        )}
                        {result.error && (
                          <span className="text-red-500 ml-1">
                            Error: {result.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={handleClose}>
              Close and Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Create a wrapper component that provides the QueryClient
export default function FixCompetitionEntriesButton(props: FixCompetitionEntriesButtonProps) {
  // Create a new QueryClient instance for this component
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
        refetchOnMount: true,
        refetchOnReconnect: true,
        structuralSharing: true,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <FixCompetitionEntriesButtonInner {...props} />
    </QueryClientProvider>
  );
}
