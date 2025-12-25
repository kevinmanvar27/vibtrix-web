"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import ModelingUserTable from "./ModelingUserTable";
import { Search, Filter, X } from "lucide-react";

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

interface ModelingFiltersProps {
  users: ModelingUser[];
}

export default function ModelingFilters({ users }: ModelingFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gender, setGender] = useState<string>("all");
  const [modelingType, setModelingType] = useState<string>("all");
  // Calculate actual age range from users data
  const usersWithAge = users.filter(user => user.age !== null);
  const youngestAge = usersWithAge.length > 0
    ? Math.min(...usersWithAge.map(user => user.age || 18))
    : 18;
  const oldestAge = usersWithAge.length > 0
    ? Math.max(...usersWithAge.map(user => user.age || 60))
    : 60;

  // Calculate actual price range from users data
  const usersWithPrice = users.filter(user => user.photoshootPricePerDay !== null);
  const lowestPrice = usersWithPrice.length > 0
    ? Math.min(...usersWithPrice.map(user => user.photoshootPricePerDay || 0))
    : 0;
  const highestPrice = usersWithPrice.length > 0
    ? Math.max(...usersWithPrice.map(user => user.photoshootPricePerDay || 0))
    : 10000;

  const [minAge, setMinAge] = useState<number>(youngestAge);
  const [maxAge, setMaxAge] = useState<number>(oldestAge);
  const [minPrice, setMinPrice] = useState<number>(lowestPrice);
  const [maxPrice, setMaxPrice] = useState<number>(highestPrice);
  const [filteredUsers, setFilteredUsers] = useState<ModelingUser[]>(users);

  // Update age and price ranges when users data changes
  useEffect(() => {
    setMinAge(youngestAge);
    setMaxAge(oldestAge);
    setMinPrice(lowestPrice);
    setMaxPrice(highestPrice);
  }, [youngestAge, oldestAge, lowestPrice, highestPrice]);

  // Apply filters whenever any filter changes
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        user =>
          user.displayName.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          (user.email && user.email.toLowerCase().includes(query))
      );
    }

    // Apply gender filter
    if (gender !== "all") {
      result = result.filter(user =>
        user.gender?.toLowerCase() === gender.toLowerCase()
      );
    }

    // Apply modeling type filter
    if (modelingType !== "all") {
      if (modelingType === "photoshoot") {
        result = result.filter(user =>
          user.photoshootPricePerDay !== null
        );
      } else if (modelingType === "videoAds") {
        result = result.filter(user =>
          user.videoAdsParticipation
        );
      } else if (modelingType === "both") {
        result = result.filter(user =>
          user.photoshootPricePerDay !== null && user.videoAdsParticipation
        );
      }
    }

    // Apply age filter
    result = result.filter(user => {
      if (user.age === null) return true; // Include users without age
      return user.age >= minAge && user.age <= maxAge;
    });

    // Apply price filter (only for users with photoshoot price)
    result = result.filter(user => {
      if (user.photoshootPricePerDay === null) return true; // Include users without price
      return user.photoshootPricePerDay >= minPrice && user.photoshootPricePerDay <= maxPrice;
    });

    setFilteredUsers(result);
  }, [users, searchQuery, gender, modelingType, minAge, maxAge, minPrice, maxPrice]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setGender("all");
    setModelingType("all");
    setMinAge(youngestAge);
    setMaxAge(oldestAge);
    setMinPrice(lowestPrice);
    setMaxPrice(highestPrice);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, username, or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Reset filters button */}
          <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Gender filter */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Modeling type filter */}
          <div className="space-y-2">
            <Label htmlFor="modelingType">Modeling Type</Label>
            <Select value={modelingType} onValueChange={setModelingType}>
              <SelectTrigger id="modelingType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="photoshoot">Photoshoot</SelectItem>
                <SelectItem value="videoAds">Video Ads</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Age range filter */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Age Range</Label>
              <span className="text-sm text-muted-foreground">
                {minAge} - {maxAge} years
              </span>
            </div>
            <div className="pt-4 px-2">
              <Slider
                defaultValue={[minAge, maxAge]}
                min={youngestAge}
                max={oldestAge}
                step={1}
                value={[minAge, maxAge]}
                onValueChange={(values) => {
                  setMinAge(values[0]);
                  setMaxAge(values[1]);
                }}
              />
            </div>
          </div>

          {/* Price range filter */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Price Range (INR)</Label>
              <span className="text-sm text-muted-foreground">
                ₹{minPrice} - ₹{maxPrice}
              </span>
            </div>
            <div className="pt-4 px-2">
              <Slider
                defaultValue={[minPrice, maxPrice]}
                min={lowestPrice}
                max={highestPrice}
                step={100}
                value={[minPrice, maxPrice]}
                onValueChange={(values) => {
                  setMinPrice(values[0]);
                  setMaxPrice(values[1]);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <ModelingUserTable users={filteredUsers} />
    </div>
  );
}
