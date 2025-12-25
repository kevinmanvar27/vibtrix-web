"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Edit, Eye, MoreHorizontal, Trash, Globe, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { deletePage, togglePageStatus } from "../actions";
import { DEFAULT_STATIC_PAGES } from "@/lib/seed-static-pages";
import { cn } from "@/lib/utils";

import debug from "@/lib/debug";

type Page = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface PageTableProps {
  pages: Page[];
}

export default function PageTable({ pages }: PageTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to check if a page is a static page
  const isStaticPage = (slug: string) => {
    return DEFAULT_STATIC_PAGES.some(page => page.slug === slug);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    try {
      await togglePageStatus(id, !currentStatus);
      toast({
        title: currentStatus ? "Page unpublished" : "Page published",
        description: `The page has been ${currentStatus ? "unpublished" : "published"} successfully.`,
      });
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: "Failed to update page status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page? This action cannot be undone.")) {
      return;
    }

    setProcessingId(id);
    try {
      await deletePage(id);
      toast({
        title: "Page deleted",
        description: "The page has been deleted successfully.",
      });
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: "Failed to delete page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                No pages found
              </TableCell>
            </TableRow>
          ) : (
            pages.map((page) => (
              <TableRow key={page.id} className={cn(isStaticPage(page.slug) ? "bg-primary/5" : "")}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {isStaticPage(page.slug) && (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                    <span className={cn(isStaticPage(page.slug) ? "font-semibold text-primary" : "")}>
                      {page.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1 py-0.5">{page.slug}</code>
                  {isStaticPage(page.slug) && (
                    <Badge variant="outline" className="ml-2 bg-primary/10 text-primary text-xs border-primary/20">
                      Static
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={page.isPublished ? "default" : "secondary"}>
                    {page.isPublished ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(page.updatedAt, "MMM d, yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={processingId === page.id}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/pages/${page.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Page
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/pages/${page.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Page
                        </Link>
                      </DropdownMenuItem>
                      {page.isPublished && (
                        <DropdownMenuItem asChild>
                          <Link href={`/pages/${page.slug}`} target="_blank">
                            <Globe className="mr-2 h-4 w-4" />
                            View Live
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleStatus(page.id, page.isPublished)}>
                        {page.isPublished ? (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Globe className="mr-2 h-4 w-4" />
                            Publish
                          </>
                        )}
                      </DropdownMenuItem>
                      {!isStaticPage(page.slug) ? (
                        <DropdownMenuItem onClick={() => handleDelete(page.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Page
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled className="text-muted-foreground cursor-not-allowed">
                          <Trash className="mr-2 h-4 w-4" />
                          Cannot Delete Static Page
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
