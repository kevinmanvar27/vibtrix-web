"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
        body: JSON.stringify({ action: "fix-feed-visibility" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fix feed visibility");
      }

      const data = await response.json();
      setResults(data.results);

      toast({
        title: "Success",
        description: data.message,
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

              <div className="flex justify-end">
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

              {results && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Results</h3>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{result.username}</span>
                          {result.disqualifiedInRound ? (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Disqualified in Round {result.disqualificationRoundIndex}
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Not Disqualified
                            </span>
                          )}
                        </div>
                        {result.updatedEntries && result.updatedEntries.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Updated entries:</p>
                            <ul className="text-xs space-y-1">
                              {result.updatedEntries.map((entry: any, entryIndex: number) => (
                                <li key={entryIndex} className="flex items-center">
                                  <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                                  Round {entry.roundIndex}: {entry.roundName}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
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
