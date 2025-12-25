"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function FixCompetitionVisibilityPage({
  params,
}: {
  params: { competitionId: string };
}) {
  const { competitionId } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleFixVisibility = async () => {
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
        throw new Error(errorData.error || "Failed to fix competition visibility");
      }

      const data = await response.json();
      setResults(data.results || []);

      toast({
        title: "Success",
        description: `${data.message}. Updated ${data.updatedEntries} entries.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fix competition visibility",
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
          <h1 className="text-2xl font-bold">Fix Competition Visibility</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fix Competition Visibility</CardTitle>
          <CardDescription>
            This tool fixes the visibility settings for all competition entries. It ensures that posts for rounds that have started are visible in the competition feed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processing ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={handleFixVisibility}>
                Fix Competition Visibility
              </Button>

              {results.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Results</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">User</th>
                          <th className="px-4 py-2 text-left">Round</th>
                          <th className="px-4 py-2 text-left">Previous Visibility</th>
                          <th className="px-4 py-2 text-left">New Visibility</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{result.username}</td>
                            <td className="px-4 py-2">{result.roundName}</td>
                            <td className="px-4 py-2">
                              Competition: {result.previousVisibility.competitionFeed ? "Yes" : "No"}<br />
                              Normal: {result.previousVisibility.normalFeed ? "Yes" : "No"}
                            </td>
                            <td className="px-4 py-2">
                              Competition: {result.newVisibility.competitionFeed ? "Yes" : "No"}<br />
                              Normal: {result.newVisibility.normalFeed ? "Yes" : "No"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
