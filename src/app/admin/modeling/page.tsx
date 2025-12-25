import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ModelingUserTable from "./components/ModelingUserTable";
import ModelingFilters from "./components/ModelingFilters";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modeling Management",
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

async function getModelingUsers() {
  return await prisma.user.findMany({
    where: {
      // Only show regular users who are interested in modeling
      // and have provided required information (DOB and contact details)
      role: "USER",
      interestedInModeling: true,
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
      interestedInModeling: true,
      photoshootPricePerDay: true,
      videoAdsParticipation: true,
      _count: {
        select: {
          followers: true,
        },
      },
    },
  });
}

export default async function ModelingPage() {
  const users = await getModelingUsers();

  // Add age to each user based on dateOfBirth
  const usersWithAge = users.map(user => ({
    ...user,
    age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modeling Management</h1>
        <p className="text-muted-foreground">
          View and filter users interested in modeling opportunities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modeling Users</CardTitle>
          <p className="text-sm text-muted-foreground">
            {usersWithAge.length} users interested in modeling opportunities
          </p>
        </CardHeader>
        <CardContent>
          <ModelingFilters users={usersWithAge} />
        </CardContent>
      </Card>
    </div>
  );
}
