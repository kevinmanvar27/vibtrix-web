"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { PageFormValues, createPage, updatePage } from "../actions";
import PageEditor from "@/components/admin/PageEditor";

import debug from "@/lib/debug";

const pageSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, {
    message: "Slug can only contain lowercase letters, numbers, and hyphens",
  }),
  content: z.string().min(10, "Content must be at least 10 characters"),
  isPublished: z.boolean(),
});

interface PageFormProps {
  page?: PageFormValues & { id: string };
}

export default function PageForm({ page }: PageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: page || {
      title: "",
      slug: "",
      content: "",
      isPublished: true,
    },
  });

  // Auto-generate slug from title
  const title = form.watch("title");
  const autoGenerateSlug = () => {
    if (!form.getValues("slug")) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      form.setValue("slug", slug, { shouldValidate: true });
    }
  };

  async function onSubmit(values: PageFormValues) {
    setIsSubmitting(true);
    try {
      if (page) {
        await updatePage(page.id, values);
        toast({
          title: "Page updated",
          description: "The page has been updated successfully.",
        });
      } else {
        await createPage(values);
        toast({
          title: "Page created",
          description: "The page has been created successfully.",
        });
        router.push("/admin/pages");
      }
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onBlur={autoGenerateSlug}
                />
              </FormControl>
              <FormDescription>
                The title of the page.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                The URL-friendly identifier for the page. Will be accessible at /pages/slug.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <PageEditor
                  content={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                The content of the page. Use the toolbar to format text and add images.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Published Status</FormLabel>
                <FormDescription>
                  Make this page visible to users.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : page ? "Update Page" : "Create Page"}
        </Button>
      </form>
    </Form>
  );
}
