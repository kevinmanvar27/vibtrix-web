#!/bin/bash

# Generate Prisma client first
echo "Generating Prisma client..."
npx prisma generate

# Apply the Prisma migrations
echo "Applying Prisma migrations..."
npx prisma migrate dev --name add_user_role_field

# Generate Prisma client again with the updated schema
echo "Regenerating Prisma client with updated schema..."
npx prisma generate

# Run the script to update existing admin users
echo "Updating admin roles..."
npx ts-node scripts/update-admin-roles.ts

echo "Migration completed successfully!"
