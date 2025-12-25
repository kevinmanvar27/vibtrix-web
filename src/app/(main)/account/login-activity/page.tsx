import { redirect } from "next/navigation";

export const metadata = {
  title: "Login Activity",
};

export default function LoginActivityPage() {
  // Redirect to the new login activity page in settings
  redirect("/settings/login-activity");
}
