import SearchField from "@/components/SearchField";
import UserButtonWrapper from "@/components/UserButtonWrapper";
import Image from "next/image";
import Link from "next/link";
import { getSiteSettings } from "./getSiteSettings";

export default async function Navbar() {
  const settings = await getSiteSettings();
  return (
    <header className="sticky top-0 z-50 bg-card shadow-sm border-b border-border/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5 sm:gap-5">
        <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary flex-shrink-0">
          {settings.logoUrl ? (
            <div className="relative overflow-hidden" style={{ height: `${settings.logoHeight}px`, width: `${settings.logoWidth}px` }}>
              <Image
                src={settings.logoUrl}
                alt="Vibtrix Logo"
                width={settings.logoWidth || 150}
                height={settings.logoHeight || 30}
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <span>Vibtrix</span>
          )}
        </Link>
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <SearchField />
        </div>
        <UserButtonWrapper className="flex-shrink-0" />
      </div>
    </header>
  );
}
