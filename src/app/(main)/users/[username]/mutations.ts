import { useToast } from "@/components/ui/use-toast";
import { PostsPage } from "@/lib/types";
import { UpdateUserProfileValues } from "@/lib/validation";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "./actions";

import debug from "@/lib/debug";

export function useUpdateProfileMutation() {
  const { toast } = useToast();

  const router = useRouter();

  const queryClient = useQueryClient();

  // Custom avatar upload function
  async function uploadAvatar(file: File) {
    // Prepare avatar file for upload

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      debug.log('Avatar upload response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to upload avatar';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the raw response text
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      try {
        return JSON.parse(responseText);
      } catch (e) {
        debug.error('Failed to parse JSON response:', e);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      debug.error('Avatar upload error:', error);
      throw error;
    }
  }

  const mutation = useMutation<
    { updatedUser: any; avatarUrl?: string; avatarError?: string },
    Error,
    { values: UpdateUserProfileValues; avatar?: File }
  >({
    mutationFn: async ({
      values,
      avatar,
    }: {
      values: UpdateUserProfileValues;
      avatar?: File;
    }) => {
      try {
        // First try to update the profile (to check for username conflicts)
        const updatedUser = await updateUserProfile(values);

        // If there's an avatar and profile update succeeded, upload the avatar
        if (avatar) {
          try {
            const uploadResult = await uploadAvatar(avatar);
            return { updatedUser, avatarUrl: uploadResult.avatarUrl };
          } catch (avatarError) {
            debug.error('Avatar upload failed:', avatarError);
            // Return the updated user even if avatar upload fails
            return { updatedUser, avatarError: avatarError instanceof Error ? avatarError.message : 'Avatar upload failed' };
          }
        }

        // If no avatar, just return the updated user
        return { updatedUser };
      } catch (error) {
        // Handle specific errors
        if (error instanceof Error) {
          if (error.message === 'Username already taken') {
            throw new Error('Username already taken');
          }
        }
        throw error;
      }
    },
    onSuccess: async ({ updatedUser, avatarUrl, avatarError }, variables, context) => {
      // Show avatar upload error if it occurred but profile was updated
      if (avatarError) {
        toast({
          variant: "destructive",
          description: `Profile updated but avatar upload failed: ${avatarError}`,
        });
      } else {

        const queryFilter: QueryFilters = {
          queryKey: ["post-feed"],
        };

        await queryClient.cancelQueries(queryFilter);

        queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
          queryFilter,
          (oldData) => {
            if (!oldData) return;

            return {
              pageParams: oldData.pageParams,
              pages: oldData.pages.map((page) => ({
                nextCursor: page.nextCursor,
                posts: page.posts.map((post) => {
                  if (post.user.id === updatedUser.id) {
                    return {
                      ...post,
                      user: {
                        ...updatedUser,
                        avatarUrl: avatarUrl || updatedUser.avatarUrl,
                      },
                    };
                  }
                  return post;
                }),
              })),
            };
          },
        );

        // Refresh the page data
        router.refresh();

        toast({
          description: "Profile updated successfully",
        });
      }
    },
    onError(error) {
      debug.error(error);
      toast({
        variant: "destructive",
        description: error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.",
      });
    },
  });

  return mutation;
}
