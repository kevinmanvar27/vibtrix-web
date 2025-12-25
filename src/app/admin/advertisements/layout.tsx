import { Toaster } from "@/components/ui/toaster";

export default function AdvertisementsLayout({
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
