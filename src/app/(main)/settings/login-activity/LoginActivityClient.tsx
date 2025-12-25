"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Clock, Laptop, MapPin, Shield } from "lucide-react";
import DeleteActivityButton from "./DeleteActivityButton";
import MobileDeleteButton from "./MobileDeleteButton";
import ClearActivitiesButton from "./ClearActivitiesButton";

interface LoginActivityClientProps {
  loginActivities: any[];
}

export default function LoginActivityClient({ loginActivities }: LoginActivityClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Login Activity</h1>
        <p className="text-muted-foreground">
          Review your recent login activity to ensure account security
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Login Activity</CardTitle>
            <CardDescription>
              This shows your last 20 login attempts, including successful and
              failed logins
            </CardDescription>
          </div>
          {loginActivities.length > 0 && <ClearActivitiesButton />}
        </CardHeader>
        <CardContent>
          {loginActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Shield className="mb-2 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No login activity recorded yet</h3>
              <p className="text-sm text-muted-foreground">
                We've updated our system to track login activity for your security.
                Your future logins will appear here, showing device and location information.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try logging out and logging back in to see your first login activity record.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loginActivities.map((activity) => (
                <div key={activity.id} className="rounded-lg border p-4 relative overflow-visible hover:border-red-200 group">
                  <DeleteActivityButton activityId={activity.id} />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <span
                          className={`mr-2 h-2 w-2 rounded-full ${
                            activity.status === "SUCCESS"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        <h3 className="font-medium">
                          {activity.status === "SUCCESS"
                            ? "Successful Login"
                            : "Failed Login Attempt"}
                        </h3>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(new Date(activity.loginAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <div className="text-right text-sm pr-10">
                      <div className="font-medium">
                        {activity.browser || "Unknown browser"}
                      </div>
                      <div className="text-muted-foreground">
                        {activity.operatingSystem || "Unknown OS"}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                    <div className="flex items-center">
                      <Laptop className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Device</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.deviceBrand
                            ? `${activity.deviceBrand} ${activity.deviceModel || ""}`
                            : "Unknown device"}
                          {activity.deviceType && ` (${activity.deviceType})`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Location</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.location || "Unknown location"}
                          {activity.ipAddress && (
                            <span className="ml-1 text-xs opacity-50">
                              ({activity.ipAddress})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile-friendly delete button */}
                  <div className="mt-3 pt-3 border-t border-gray-100 text-center sm:hidden">
                    <MobileDeleteButton activityId={activity.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
