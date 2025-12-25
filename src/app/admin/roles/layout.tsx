import { Toaster } from "@/components/ui/toaster";

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
