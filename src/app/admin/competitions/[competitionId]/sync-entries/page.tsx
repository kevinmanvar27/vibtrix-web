"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { invalidateCompetitionFeedQueries } from "@/lib/query-utils";
import { syncCompetitionEntries } from "./action";

import debug from "@/lib/debug";

export default function SyncCompetitionEntriesPage({
  params,
}: {
  params: { competitionId: string };
}) {
  const { competitionId } = params;
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<{ entriesUpdated?: number; error?: string } | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);

    try {
      // Use the server action instead of the API route
      const result = await syncCompetitionEntries(competitionId);

      setResult({ entriesUpdated: result.entriesUpdated });

      // Invalidate all competition feed queries to ensure fresh data
      invalidateCompetitionFeedQueries(queryClient, competitionId);

      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error) {
      debug.error("Error synchronizing entries:", error);
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });

      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to synchronize entries",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/competitions/${competitionId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Synchronize Competition Entries</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fix Visibility Issues</CardTitle>
          <CardDescription>
            This tool will fix any visibility issues with competition entries, ensuring that all posts
            appear correctly in both the "All Rounds" view and specific round views.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Use this tool if you notice that some posts are appearing differently in different views,
            or if some posts are missing from certain views.
          </p>

          {result && (
            <div className={`p-4 rounded-lg ${result.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
              {result.error ? (
                <p>Error: {result.error}</p>
              ) : (
                <p>Successfully synchronized {result.entriesUpdated} competition entries.</p>
              )}
            </div>
          )}

          <Button onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Synchronizing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Synchronize Entries
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
