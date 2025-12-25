"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, Clock, Loader2, ThumbsUp, Trophy, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ProcessQualificationPageProps {
  params: {
    competitionId: string;
  };
}

interface Round {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  likesToPass: number | null;
}

interface Competition {
  id: string;
  title: string;
  rounds: Round[];
}

export default function ProcessQualificationPage({ params }: ProcessQualificationPageProps) {
  const { competitionId } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    async function fetchCompetition() {
      try {
        const response = await fetch(`/api/admin/competitions/${competitionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch competition");
        }
        const data = await response.json();
        setCompetition(data);
        
        // Find the first completed round
        const currentDate = new Date();
        const completedRound = data.rounds.find((round: Round) => 
          new Date(round.endDate) < currentDate
        );
        
        if (completedRound) {
          setSelectedRoundId(completedRound.id);
        }
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

  const handleProcessQualification = async () => {
    if (!selectedRoundId) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/competitions/${competitionId}/process-qualification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roundId: selectedRoundId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process qualification");
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
        description: error instanceof Error ? error.message : "Failed to process qualification",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Competition Not Found</h1>
        <Button onClick={() => router.push("/admin/competitions")}>
          Back to Competitions
        </Button>
      </div>
    );
  }

  const currentDate = new Date();
  const rounds = competition.rounds.filter(round => new Date(round.endDate) < currentDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Process Qualification</h1>
        <Button variant="outline" onClick={() => router.push(`/admin/competitions/${competitionId}`)}>
          Back to Competition
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{competition.title}</CardTitle>
          <CardDescription>
            Process qualification for completed rounds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rounds.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">No Completed Rounds</h3>
              <p className="text-sm text-muted-foreground">
                There are no completed rounds to process qualification for.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Select Round</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rounds.map((round) => (
                    <div
                      key={round.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedRoundId === round.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedRoundId(round.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{round.name}</span>
                        {selectedRoundId === round.id && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Likes to pass: {round.likesToPass || "Not specified"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleProcessQualification}
                  disabled={!selectedRoundId || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      Process Qualification
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Qualification Results</CardTitle>
            <CardDescription>
              Results of the qualification process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-1">No Entries</h3>
                  <p className="text-sm text-muted-foreground">
                    There were no entries to process for this round.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Entry ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Likes</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {results.map((result) => (
                        <tr key={result.entryId}>
                          <td className="px-4 py-3 text-sm">{result.entryId}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              {result.status === "qualified" ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                                  <span className="text-green-600">Qualified</span>
                                </>
                              ) : result.status === "disqualified" ? (
                                <>
                                  <X className="h-4 w-4 text-red-500 mr-1.5" />
                                  <span className="text-red-600">Disqualified</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">{result.status}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <ThumbsUp className="h-3.5 w-3.5 text-pink-500 mr-1.5" />
                              {result.likesCount || "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {result.likesToPass || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => setResults(null)}>
              Close Results
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
