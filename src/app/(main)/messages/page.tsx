import { Metadata } from "next";
import Chat from "./Chat";
import prisma from "@/lib/prisma";
import { Shield } from "lucide-react";
import MessagesQueryProvider from "./MessagesQueryProvider";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function Page() {
  // Check if messaging feature is enabled
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
    select: { messagingEnabled: true },
  });

  if (!settings?.messagingEnabled) {
    return (
      <main className="w-full">
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Messaging Disabled</h1>
          <p className="text-muted-foreground text-center max-w-md">
            The messaging feature has been disabled by the administrator.
          </p>
        </div>
      </main>
    );
  }

  return (
    <MessagesQueryProvider>
      <Chat />
    </MessagesQueryProvider>
  );
}
