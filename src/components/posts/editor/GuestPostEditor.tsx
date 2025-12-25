"use client";

import { Button } from "@/components/ui/button";
import { useGuestSession } from "@/components/GuestSessionProvider";
import { ImageIcon } from "lucide-react";
import TipTapWrapper from "@/components/ui/tiptap-wrapper";
import UserAvatar from "@/components/UserAvatar";

export default function GuestPostEditor() {
  const { redirectToLogin } = useGuestSession();

  const handleClick = () => {
    // Redirect to Google login with the current URL as the return URL
    redirectToLogin();
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex gap-5">
        <UserAvatar
          avatarUrl={null}
          className="hidden sm:inline"
          showStatus={false}
        />
        <div className="w-full" onClick={handleClick}>
          <TipTapWrapper
            content=""
            placeholder="Sign in to share your thoughts..."
            onChange={() => {}}
            className="max-h-[20rem] w-full overflow-y-auto rounded-2xl bg-background px-5 py-3 cursor-pointer"
            editable={false}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:text-primary"
          onClick={handleClick}
        >
          <ImageIcon size={20} />
        </Button>
        <Button onClick={handleClick} className="min-w-20">
          Sign in to post
        </Button>
      </div>
    </div>
  );
}
