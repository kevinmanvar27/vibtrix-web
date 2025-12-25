"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Payment, User, Competition } from "@prisma/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Link from "next/link";

type PaymentWithRelations = Payment & {
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
  };
  competition: {
    id: string;
    title: string;
  } | null;
};

interface PaymentsTableProps {
  payments: PaymentWithRelations[];
}

export default function PaymentsTable({ payments }: PaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter payments based on search term
  const filteredPayments = payments.filter((payment) => {
    const searchString = searchTerm.toLowerCase();
    return (
      payment.id.toLowerCase().includes(searchString) ||
      payment.user.username.toLowerCase().includes(searchString) ||
      payment.user.displayName.toLowerCase().includes(searchString) ||
      (payment.user.email && payment.user.email.toLowerCase().includes(searchString)) ||
      (payment.competition?.title && payment.competition.title.toLowerCase().includes(searchString)) ||
      payment.status.toLowerCase().includes(searchString) ||
      (payment.orderId && payment.orderId.toLowerCase().includes(searchString)) ||
      (payment.paymentId && payment.paymentId.toLowerCase().includes(searchString))
    );
  });

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"; // Using default for completed payments (typically green)
      case "PENDING":
        return "secondary"; // Using secondary for pending payments (typically yellow)
      case "FAILED":
        return "destructive"; // Keep destructive for failed payments (red)
      case "REFUNDED":
        return "outline"; // Using outline for refunded payments
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm("")}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Competition</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">
                      <Link href={`/admin/users/${payment.user.id}`} className="hover:underline">
                        {payment.user.displayName}
                      </Link>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{payment.user.username}
                    </div>
                  </TableCell>
                  <TableCell>
                    {payment.competition ? (
                      <Link href={`/admin/competitions/${payment.competition.id}`} className="hover:underline">
                        {payment.competition.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>₹{payment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(payment.status)}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {payment.paymentId || "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
