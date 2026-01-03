import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BrandAmbassadorshipUserTable from "./components/BrandAmbassadorshipUserTable";
import BrandAmbassadorshipFilters from "./components/BrandAmbassadorshipFilters";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Ambassadorship Management",
};

// Enable ISR with 60 second revalidation
export const revalidate = 60;

// Function to calculate age from date of birth (DD-MM-YYYY format)
function calculateAge(dateOfBirth: string): number | null {
  try {
    // Parse the date of birth which is stored in DD-MM-YYYY format
    const [day, month, year] = dateOfBirth.split('-').map(Number);
    
    // Create a valid date object (months are 0-indexed in JavaScript)
    const birthDate = new Date(year, month - 1, day);
    
    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
}

interface BrandAmbassadorshipPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    gender?: string;
  };
}

async function getBrandAmbassadorshipUsers(page: number = 1, limit: number = 25, gender?: string) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    role: "USER",
    interestedInBrandAmbassadorship: true,
    dateOfBirth: { not: null },
    whatsappNumber: { not: null },
  };

  // Add gender filter if specified
  if (gender && gender !== 'all') {
    where.gender = gender.toUpperCase();
  }

  // Run both queries in parallel
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        gender: true,
        dateOfBirth: true,
        whatsappNumber: true,
        isActive: true,
        createdAt: true,
        interestedInBrandAmbassadorship: true,
        brandAmbassadorshipPricing: true,
        brandPreferences: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

export default async function BrandAmbassadorshipPage({ searchParams }: BrandAmbassadorshipPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '25', 10);
  const gender = searchParams.gender;

  const { users, totalCount, totalPages, currentPage } = await getBrandAmbassadorshipUsers(page, limit, gender);
  
  // Add age to each user based on dateOfBirth
  const usersWithAge = users.map(user => ({
    ...user,
    age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brand Ambassadorship Management</h1>
        <p className="text-muted-foreground">
          View and filter users interested in brand ambassadorship opportunities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Ambassadorship Users</CardTitle>
          <p className="text-sm text-muted-foreground">
            {totalCount} users interested in brand ambassadorship opportunities
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </p>
        </CardHeader>
        <CardContent>
          <BrandAmbassadorshipFilters 
            users={usersWithAge}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            currentGender={gender || 'all'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
