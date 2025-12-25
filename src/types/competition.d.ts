import { CompetitionRoundEntry, Post, Media } from "@prisma/client";

// Extend the CompetitionParticipant type to include roundEntries
declare global {
  namespace PrismaJson {
    interface CompetitionParticipantWithRoundEntries {
      id: string;
      userId: string;
      competitionId: string;
      isDisqualified: boolean;
      disqualifyReason: string | null;
      createdAt: Date;
      user: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
      };
      roundEntries?: Array<CompetitionRoundEntryWithPost>;
    }

    interface CompetitionRoundEntryWithPost extends CompetitionRoundEntry {
      round: {
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
        likesToPass: number | null;
      };
      post: PostWithAttachments | null;
    }

    interface PostWithAttachments extends Post {
      attachments: Media[];
    }
  }
}
