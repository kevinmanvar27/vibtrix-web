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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import PageEditor from "@/components/admin/PageEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { CompetitionMediaType } from "@prisma/client";
import { CompetitionFormValues, PromotionStickerData, createCompetition, updateCompetition } from "../actions";
import PromotionStickersSection from "./PromotionStickersSection";
import { PlusCircle, X, AlertTriangle, Trophy, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import debug from "@/lib/debug";

const roundSchema = z.object({
  name: z.string().min(1, "Round name is required"),
  startDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Invalid start date",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Invalid end date",
  }),
  endTime: z.string().min(1, "End time is required"),
  likesToPass: z.coerce.number().int().optional().nullable(),
});

const prizeSchema = z.object({
  position: z.enum(["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "PARTICIPATION"]),
  amount: z.coerce.number().min(0, "Prize amount must be at least 0"),
  description: z.string().optional().nullable(),
});

const competitionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  mediaType: z.nativeEnum(CompetitionMediaType),
  minLikes: z.coerce.number().int().optional().nullable(),
  maxDuration: z.coerce.number().int().optional().nullable(),
  minAge: z.coerce.number().int().optional().nullable(),
  maxAge: z.coerce.number().int().optional().nullable(),
  requiredGender: z.string().optional().nullable(),
  isActive: z.boolean(),
  isPaid: z.boolean().default(false),
  entryFee: z.coerce.number().min(0).optional().nullable(),
  defaultHashtag: z.string().optional().nullable()
    .transform(val => {
      if (!val) return null;
      // Ensure the hashtag starts with #
      return val.startsWith('#') ? val : `#${val}`;
    }),
  // hasPrizes is determined by whether there are prizes
  prizes: z.array(prizeSchema).optional(),
  rounds: z.array(roundSchema).min(1, "At least one round is required"),
}).refine(data => {
  // If both minAge and maxAge are provided, ensure maxAge is greater than or equal to minAge
  if (data.minAge !== null && data.maxAge !== null && data.maxAge !== undefined && data.minAge !== undefined) {
    return data.maxAge >= data.minAge;
  }
  return true;
}, {
  message: "Maximum age must be greater than or equal to minimum age",
  path: ["maxAge"], // This will show the error on the maxAge field
});

interface CompetitionFormProps {
  competition?: CompetitionFormValues & { id: string };
  startedRoundIds?: string[];
}

const CompetitionForm = forwardRef<any, CompetitionFormProps>(({ competition, startedRoundIds = [] }, ref) => {
  // Debug
  debug.log("Competition:", competition);
  debug.log("Started Round IDs:", startedRoundIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promotionStickers, setPromotionStickers] = useState<PromotionStickerData[]>([]);

  // Function to handle promotion stickers
  const handlePromotionStickers = (stickers: any[]) => {
    const formattedStickers = stickers.map(sticker => ({
      title: sticker.title,
      imageUrl: sticker.imageUrl,
      position: sticker.position,
      limit: sticker.limit,
      isActive: sticker.isActive
    }));
    setPromotionStickers(formattedStickers);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handlePromotionStickers
  }));

  const { toast } = useToast();
  const router = useRouter();

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split("T")[0];

  // Default start and end times for competitions
  const defaultStartTime = "00:01:00";
  const defaultEndTime = "23:59:00";

  // Ensure round IDs are preserved when editing
  const formDefaultValues = competition ? {
    ...competition,
    rounds: competition.rounds.map(round => ({
      ...round,
      // Ensure the original ID is preserved
      id: round.id
    }))
  } : null;

  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: formDefaultValues || {
      title: "",
      description: "",
      mediaType: "BOTH",
      minLikes: null,
      maxDuration: null,
      minAge: null,
      maxAge: null,
      requiredGender: "none",
      isActive: true,
      isPaid: false,
      entryFee: null,
      defaultHashtag: "",
      // hasPrizes is determined by whether there are prizes
      prizes: [],
      rounds: [
        {
          name: "Round 1",
          startDate: today,
          startTime: defaultStartTime,
          endDate: today,
          endTime: defaultEndTime,
          likesToPass: null,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rounds",
  });

  const {
    fields: prizeFields,
    append: appendPrize,
    remove: removePrize
  } = useFieldArray({
    control: form.control,
    name: "prizes",
  });

  const mediaType = form.watch("mediaType");
  const hasPrizes = (form.watch("prizes") || []).length > 0;

  // Function to validate rounds don't overlap
  const validateRounds = (rounds: any[]) => {
    // Helper function to combine date and time into a Date object
    const combineDateTime = (dateStr: string, timeStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const timeParts = timeStr.split(':').map(Number);
      const hours = timeParts[0];
      const minutes = timeParts[1];
      const seconds = timeParts.length > 2 ? timeParts[2] : 0; // Handle seconds if present
      return new Date(year, month - 1, day, hours, minutes, seconds);
    };

    // Sort rounds by start date and time
    const sortedRounds = [...rounds].sort((a, b) => {
      const aStart = combineDateTime(a.startDate, a.startTime).getTime();
      const bStart = combineDateTime(b.startDate, b.startTime).getTime();
      return aStart - bStart;
    });

    // Check for overlaps
    for (let i = 0; i < sortedRounds.length - 1; i++) {
      const currentRound = sortedRounds[i];
      const nextRound = sortedRounds[i + 1];

      const currentEnd = combineDateTime(currentRound.endDate, currentRound.endTime);
      const nextStart = combineDateTime(nextRound.startDate, nextRound.startTime);

      if (currentEnd >= nextStart) {
        return `${currentRound.name} ends after ${nextRound.name} starts. Rounds cannot overlap.`;
      }
    }

    // Also validate that each round's end time is after its start time
    for (const round of rounds) {
      const startDateTime = combineDateTime(round.startDate, round.startTime);
      const endDateTime = combineDateTime(round.endDate, round.endTime);

      if (endDateTime <= startDateTime) {
        return `${round.name}: End date/time must be after start date/time`;
      }
    }

    return true;
  };

  async function onSubmit(values: CompetitionFormValues) {
    // Validate rounds don't overlap
    const roundsValidation = validateRounds(values.rounds);
    if (roundsValidation !== true) {
      toast({
        title: "Invalid rounds",
        description: roundsValidation,
        variant: "destructive",
      });
      return;
    }

    // Additional validation for age restrictions
    if (values.minAge !== null && values.maxAge !== null &&
        values.maxAge !== undefined && values.minAge !== undefined &&
        values.maxAge < values.minAge) {
      toast({
        title: "Invalid age range",
        description: "Maximum age must be greater than or equal to minimum age",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (competition) {
        const result = await updateCompetition(competition.id, values);
        debug.log('Update result:', result);
        toast({
          title: "Competition updated",
          description: "The competition has been updated successfully.",
          variant: "default",
          duration: 5000,
        });

        // Redirect to the competition list page
        router.push("/admin/competitions");
      } else {
        // Create competition with promotion stickers
        debug.log('Creating competition with values:', values);
        debug.log('Promotion stickers:', promotionStickers);
        try {
          const result = await createCompetition(values, promotionStickers);
          debug.log('Create result:', result);

          toast({
            title: "Competition created",
            description: "The competition has been created successfully.",
            variant: "default",
            duration: 5000,
          });
          router.push("/admin/competitions");
        } catch (createError) {
          debug.error('Error in createCompetition:', createError);
          throw createError;
        }
      }
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save competition. Please try again.",
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
                <Input {...field} />
              </FormControl>
              <FormDescription>
                The title of the competition.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <div className="min-h-[200px] border rounded-md">
                  <PageEditor
                    content={field.value || ""}
                    onChange={field.onChange}
                  />
                </div>
              </FormControl>
              <FormDescription>
                A brief description of the competition. You can use formatting options to make your description more engaging.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultHashtag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Hashtag</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder="e.g. #SummerContest"
                />
              </FormControl>
              <FormDescription>
                This hashtag will be automatically added to all posts in this competition. The # symbol will be added automatically if not included.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="mediaType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Media Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IMAGE_ONLY">Image</SelectItem>
                    <SelectItem value="VIDEO_ONLY">Video</SelectItem>
                    <SelectItem value="BOTH">Any</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  What type of media is allowed in this competition.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {(mediaType === "VIDEO_ONLY" || mediaType === "BOTH") && (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="maxDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Video Duration (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Optional"
                      {...field}
                      value={field.value === null ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum video duration in seconds (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="minAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Minimum age requirement for participants (optional).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Maximum age requirement for participants (optional).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="requiredGender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender Restriction</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender restriction" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Open for All</SelectItem>
                  <SelectItem value="Male">Male Only</SelectItem>
                  <SelectItem value="Female">Female Only</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Restrict competition to participants of a specific gender (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Competition Rounds</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Get the end date and time of the last round to set as the start date and time for the new round
                let newStartDate = today;
                let newStartTime = defaultStartTime;

                if (fields.length > 0) {
                  const lastRound = form.getValues(`rounds.${fields.length - 1}`);
                  // Use the same end date and time from the previous round as the start date and time for the new round
                  newStartDate = lastRound.endDate;
                  newStartTime = lastRound.endTime;
                }

                // Set end date to the same day as the start date
                const newEndDate = newStartDate;

                append({
                  name: `Round ${fields.length + 1}`,
                  startDate: newStartDate,
                  startTime: newStartTime,
                  endDate: newEndDate,
                  endTime: defaultEndTime,
                  likesToPass: null,
                });
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Round
            </Button>
          </div>

          {fields.map((field, index) => {
            // Debug
            debug.log(`Round ${index}:`, field);

            // Check if this round has started
            // For existing competitions, we need to check if the round ID is in the startedRoundIds
            // For new rounds in existing competitions, we need to make sure they're not marked as started
            let isStarted = false;

            if (competition) {
              // If this is an existing round with an ID that matches a started round ID
              if (field.id && typeof field.id === 'string' && startedRoundIds.includes(field.id)) {
                isStarted = true;
                debug.log(`Round ${index} is started (ID match);:`, field.id);
              }
              // If this is a round from the original competition data (by name match)
              else if (field.name && typeof field.name === 'string') {
                // Find all matching rounds by name
                const matchingRounds = competition.rounds.filter(r => r.name === field.name && r.id);

                if (matchingRounds.length > 0) {
                  // Sort by createdAt to get the most recent one
                  matchingRounds.sort((a: any, b: any) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

                  // Use the most recent matching round
                  const mostRecentRound = matchingRounds[0];

                  if (mostRecentRound && mostRecentRound.id) {
                    // Update the field ID to match the original round ID
                    field.id = mostRecentRound.id;
                    isStarted = startedRoundIds.includes(mostRecentRound.id);
                    debug.log(`Round ${index} is started (name match);:`, isStarted, "ID:", field.id);
                  }
                }
              }
            }

            return (
              <Card key={field.id} className={`relative ${isStarted ? 'border-amber-300 dark:border-amber-700' : ''}`}>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => remove(index)}
                    disabled={isStarted}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    Round {index + 1}
                    {isStarted && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-full font-normal">
                        Started
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                {isStarted && (
                  <div className="mx-6 -mt-2 mb-4">
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-md p-2 text-xs text-amber-700 dark:text-amber-400">
                      <p className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3" />
                        This round has already started and cannot be modified
                      </p>
                    </div>
                  </div>
                )}
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`rounds.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Round Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isStarted} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`rounds.${index}.startDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                min={index === 0 ? today : form.getValues(`rounds.${index - 1}.endDate`)}
                                {...field}
                                disabled={isStarted}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`rounds.${index}.startTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                step="1"
                                {...field}
                                disabled={isStarted}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`rounds.${index}.endDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                min={form.watch(`rounds.${index}.startDate`)}
                                {...field}
                                disabled={isStarted}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`rounds.${index}.endTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                step="1"
                                {...field}
                                disabled={isStarted}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name={`rounds.${index}.likesToPass`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Likes to Pass</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Optional"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                            disabled={isStarted}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum likes required to pass this round (optional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            );
          })}
          {form.formState.errors.rounds?.root && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.rounds.root.message}</p>
          )}
        </div>

        {/* Promotion Stickers Section is now handled outside this component */}

        {/* Prize Distribution Section */}
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Prize Distribution</h3>
          </div>

          {/* Prize Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Prize Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Check if we already have this position
                    const positions = prizeFields.map(field => field.position);
                    const availablePositions = [
                      "FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "PARTICIPATION"
                    ].filter(pos => !positions.includes(pos as any));

                    if (availablePositions.length === 0) {
                      toast({
                        title: "All prize positions used",
                        description: "You've already added all available prize positions.",
                        variant: "destructive",
                      });
                      return;
                    }

                    appendPrize({
                      position: availablePositions[0] as any,
                      amount: 0,
                      description: null,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Prize
                </Button>
              </div>

              {prizeFields.length === 0 && (
                <div className="text-center p-4 border border-dashed rounded-md">
                  <p className="text-muted-foreground">No prizes added yet. Click "Add Prize" to start.</p>
                </div>
              )}

              {prizeFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b pb-4">
                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`prizes.${index}.position`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select position" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FIRST">1st Place</SelectItem>
                              <SelectItem value="SECOND">2nd Place</SelectItem>
                              <SelectItem value="THIRD">3rd Place</SelectItem>
                              <SelectItem value="FOURTH">4th Place</SelectItem>
                              <SelectItem value="FIFTH">5th Place</SelectItem>
                              <SelectItem value="PARTICIPATION">Participation</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`prizes.${index}.amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (INR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`prizes.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Additional details about this prize"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end justify-end h-full pb-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrize(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Make this competition visible to users.
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

          <FormField
            control={form.control}
            name="isPaid"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Paid Competition</FormLabel>
                  <FormDescription>
                    Require payment to join this competition.
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
        </div>

        {form.watch("isPaid") && (
          <FormField
            control={form.control}
            name="entryFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Fee (INR)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>
                  The amount users must pay to join this competition (in Indian Rupees).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : competition ? "Update Competition" : "Create Competition"}
        </Button>
      </form>
    </Form>
  );
});

CompetitionForm.displayName = "CompetitionForm";

export default CompetitionForm;
