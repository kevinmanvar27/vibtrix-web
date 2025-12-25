import { PostData } from "@/lib/types";
import { Loader2, SendHorizonal } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useSubmitCommentMutation } from "./mutations";
import RequireAuth from "@/components/RequireAuth";
import { useGuestSession } from "@/components/GuestSessionProvider";
import { useSession } from "@/app/(main)/SessionProvider";

interface CommentInputProps {
  post: PostData;
}

export default function CommentInput({ post }: CommentInputProps) {
  const [input, setInput] = useState("");
  const mutation = useSubmitCommentMutation(post.id);

  // Get session information
  const { isLoggedIn } = useSession();
  const { redirectToLogin } = useGuestSession();
  const isGuest = !isLoggedIn;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!input) return;

    mutation.mutate(
      {
        post,
        content: input,
      },
      {
        onSuccess: () => setInput(""),
      },
    );
  }

  // For guest users, show a read-only input that redirects to login when clicked
  if (isGuest) {
    return (
      <div className="flex w-full items-center gap-2">
        <RequireAuth>
          <Input
            placeholder="Sign in to comment..."
            readOnly
            className="cursor-pointer"
          />
        </RequireAuth>
        <RequireAuth>
          <Button
            type="button"
            variant="ghost"
            size="icon"
          >
            <SendHorizonal />
          </Button>
        </RequireAuth>
      </div>
    );
  }

  // For logged-in users, show the normal comment input
  return (
    <form className="flex w-full items-center gap-2" onSubmit={onSubmit}>
      <Input
        placeholder="Write a comment..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={!input.trim() || mutation.isPending}
      >
        {!mutation.isPending ? (
          <SendHorizonal />
        ) : (
          <Loader2 className="animate-spin" />
        )}
      </Button>
    </form>
  );
}
