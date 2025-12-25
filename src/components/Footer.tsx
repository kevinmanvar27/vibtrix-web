"use client";

import { DEFAULT_STATIC_PAGES } from "@/lib/static-pages-data";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Don't show footer on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-border/30 bg-card py-6 hidden sm:block">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Vibtrix. All rights reserved.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {DEFAULT_STATIC_PAGES.map((page) => (
              <Link
                key={page.slug}
                href={`/pages/${page.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {page.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
