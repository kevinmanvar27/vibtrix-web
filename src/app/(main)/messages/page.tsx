import { Metadata } from "next";
import Chat from "./Chat";
import MessagesQueryProvider from "./MessagesQueryProvider";

export const metadata: Metadata = {
  title: "Messages",
};

// Remove server-side checks to make page instant - checks happen in Chat component
export default function Page() {
  return (
    <MessagesQueryProvider>
      <Chat />
    </MessagesQueryProvider>
  );
}
