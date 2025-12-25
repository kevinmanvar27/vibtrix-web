"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CheckCircle, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface FixFeedVisibilityPageProps {
  params: {
    competitionId: string;
  };
}

interface Competition {
  id: string;
  title: string;
  rounds: {
    id: string;
    name: string;
  }[];
}

export default function FixFeedVisibilityPage({ params }: FixFeedVisibilityPageProps) {
  const { competitionId } = params;
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchCompetition() {
      try {
        const response = await fetch(`/api/admin/competitions/${competitionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch competition");
        }
        const data = await response.json();
        setCompetition(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch competition",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCompetition();
  }, [competitionId, toast]);

  const handleFixFeedVisibility = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/competitions/${competitionId}/manage-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "fix-feed-visibility-v2" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fix feed visibility");
      }

      const data = await response.json();
      setResults(data.results);

      toast({
        title: "Success",
        description: `${data.message}. Updated ${data.updatedEntries} entries.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fix feed visibility",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDebugEntries = async () => {
    try {
      window.open(`/api/competitions/${competitionId}/debug-entries`, '_blank');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open debug entries",
      });
    }
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href={`/admin/competitions/${competitionId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Fix Competition Feed Visibility</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fix Feed Visibility</CardTitle>
          <CardDescription>
            This tool fixes the visibility settings for all competition entries. It ensures that posts from disqualified participants are visible in the competition feed for the round they were submitted to, but not visible in the competition feed for subsequent rounds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Competition: {competition?.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will fix the visibility settings for all entries in this competition.
                </p>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleDebugEntries}
                  disabled={processing}
                >
                  Debug Entries
                </Button>

                <Button
                  onClick={handleFixFeedVisibility}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Fix Feed Visibility
                    </>
                  )}
                </Button>
              </div>

              {results && results.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Updated Entries</h3>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{result.username}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Round {result.roundIndex}: {result.roundName}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-red-500 line-through mr-2">
                            {result.previousValue ? "Visible in competition feed" : "Hidden from competition feed"}
                          </span>
                          <span className="text-green-500">
                            {result.newValue ? "Visible in competition feed" : "Hidden from competition feed"}
                          </span>
                        </div>
                        {result.disqualifiedInPreviousRound && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            User was disqualified in {result.disqualificationRound}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results && results.length === 0 && (
                <div className="mt-8 p-4 bg-green-50 text-green-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>All entries already have the correct visibility settings.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
