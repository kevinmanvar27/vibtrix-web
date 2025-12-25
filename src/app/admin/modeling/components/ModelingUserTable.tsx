"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Camera, Check, IndianRupee, MoreHorizontal, User, Video, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

type ModelingUser = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  whatsappNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  interestedInModeling: boolean;
  photoshootPricePerDay: number | null;
  videoAdsParticipation: boolean;
  age: number | null;
  _count: {
    followers: number;
  };
};

interface ModelingUserTableProps {
  users: ModelingUser[];
}

export default function ModelingUserTable({ users }: ModelingUserTableProps) {
  const { toast } = useToast();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Followers</TableHead>
            <TableHead>Photoshoot</TableHead>
            <TableHead>Video Ads</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No modeling users found matching the current filters.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                      <AvatarFallback>
                        {user.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={() => window.open(`/users/${user.username}`, '_blank')}
                      >
                        {user.displayName}
                      </div>
                      <div
                        className="text-sm text-muted-foreground cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={() => window.open(`/users/${user.username}`, '_blank')}
                      >
                        @{user.username}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.gender ? (
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                      <User className="h-3 w-3 mr-1" />
                      {user.gender}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not specified</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.age ? (
                    <span>{user.age} years</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not specified</span>
                  )}
                </TableCell>
                <TableCell>{user._count.followers}</TableCell>
                <TableCell>
                  {user.photoshootPricePerDay !== null ? (
                    <div className="flex items-center">
                      <IndianRupee className="h-3.5 w-3.5 mr-1 text-green-600" />
                      <span className="font-medium">{user.photoshootPricePerDay}/day</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      <X className="h-3 w-3 mr-1" />
                      Not Available
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.videoAdsParticipation ? (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      <X className="h-3 w-3 mr-1" />
                      Not Available
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.whatsappNumber ? (
                    <Link
                      href={`https://wa.me/${user.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 hover:underline"
                    >
                      {user.whatsappNumber}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not available</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}`}>
                          <User className="mr-2 h-4 w-4" />
                          View User Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          window.open(`/users/${user.username}`, '_blank');
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        View Public Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          if (user.whatsappNumber) {
                            window.open(`https://wa.me/${user.whatsappNumber.replace(/[^0-9]/g, '')}`, '_blank');
                          } else {
                            toast({
                              variant: 'destructive',
                              title: 'No WhatsApp Number',
                              description: 'This user has not provided a WhatsApp number.',
                            });
                          }
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Contact via WhatsApp
                      </DropdownMenuItem>
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
