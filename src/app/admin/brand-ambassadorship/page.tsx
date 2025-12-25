import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BrandAmbassadorshipUserTable from "./components/BrandAmbassadorshipUserTable";
import BrandAmbassadorshipFilters from "./components/BrandAmbassadorshipFilters";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Ambassadorship Management",
};

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

async function getBrandAmbassadorshipUsers() {
  return await prisma.user.findMany({
    where: {
      // Only show regular users who are interested in brand ambassadorship
      // and have provided required information (DOB and contact details)
      role: "USER",
      interestedInBrandAmbassadorship: true,
      dateOfBirth: { not: null },
      whatsappNumber: { not: null },
    },
    orderBy: { createdAt: "desc" },
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
  });
}

export default async function BrandAmbassadorshipPage() {
  const users = await getBrandAmbassadorshipUsers();
  
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
            {usersWithAge.length} users interested in brand ambassadorship opportunities
          </p>
        </CardHeader>
        <CardContent>
          <BrandAmbassadorshipFilters users={usersWithAge} />
        </CardContent>
      </Card>
    </div>
  );
}
