"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Bug } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import debug from "@/lib/debug";

interface DebugCompetitionEntriesButtonProps {
  competitionId: string;
}

export default function DebugCompetitionEntriesButton({ competitionId }: DebugCompetitionEntriesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDebug = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/competitions/${competitionId}/debug-entries`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to debug entries");
      }

      const data = await response.json();
      setDebugData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      debug.error("Error debugging entries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleDebug}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Bug className="h-4 w-4" />
        Debug Entries
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Competition Entries Debug</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] w-full pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading debug information...</span>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                <h3 className="font-medium mb-2">Error</h3>
                <p>{error}</p>
              </div>
            ) : debugData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Competition</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <p><strong>ID:</strong> {debugData.competition.id}</p>
                    <p><strong>Name:</strong> {debugData.competition.name}</p>
                    <p><strong>Rounds:</strong> {debugData.competition.rounds.length}</p>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="font-medium mb-2">Rounds</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {debugData.competition.rounds.map((round: any) => (
                        <div key={round.id} className="bg-muted p-3 rounded-md">
                          <p><strong>ID:</strong> {round.id}</p>
                          <p><strong>Name:</strong> {round.name}</p>
                          <p><strong>Start Date:</strong> {new Date(round.startDate).toLocaleString()}</p>
                          <p><strong>End Date:</strong> {new Date(round.endDate).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Participants ({debugData.participants.length})</h3>
                  <div className="space-y-4">
                    {debugData.participants.map((participant: any) => (
                      <div key={participant.id} className="border border-border p-4 rounded-md">
                        <h4 className="font-medium">{participant.displayName} (@{participant.username})</h4>
                        <p className="text-sm text-muted-foreground mb-2">ID: {participant.id}</p>
                        
                        <h5 className="font-medium mt-3 mb-2">Entries ({participant.entries.length})</h5>
                        {participant.entries.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {participant.entries.map((entry: any) => (
                              <div key={entry.id} className={`p-3 rounded-md ${entry.hasPost ? 'bg-green-100 dark:bg-green-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
                                <p><strong>Round:</strong> {entry.roundName}</p>
                                <p><strong>Entry ID:</strong> {entry.id}</p>
                                <p><strong>Post ID:</strong> {entry.postId || 'None'}</p>
                                <p><strong>Has Post:</strong> {entry.hasPost ? 'Yes' : 'No'}</p>
                                <p><strong>Attachments:</strong> {entry.attachmentCount}</p>
                                <p><strong>Visible in Competition Feed:</strong> {entry.visibleInCompetitionFeed ? 'Yes' : 'No'}</p>
                                <p><strong>Visible in Normal Feed:</strong> {entry.visibleInNormalFeed ? 'Yes' : 'No'}</p>
                                <p><strong>Created:</strong> {new Date(entry.createdAt).toLocaleString()}</p>
                                <p><strong>Updated:</strong> {new Date(entry.updatedAt).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No entries found</p>
                        )}
                        
                        <h5 className="font-medium mt-3 mb-2">Missing Rounds ({participant.missingRounds.length})</h5>
                        {participant.missingRounds.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {participant.missingRounds.map((round: any) => (
                              <div key={round.id} className="bg-red-100 dark:bg-red-900/20 p-3 rounded-md">
                                <p><strong>Round ID:</strong> {round.id}</p>
                                <p><strong>Round Name:</strong> {round.name}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-green-600 dark:text-green-400">No missing rounds</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
