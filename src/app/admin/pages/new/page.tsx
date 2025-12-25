import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageForm from "../components/PageForm";

export const metadata = {
  title: "Create New Page",
};

export default function NewPagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Page</h1>
        <p className="text-muted-foreground">
          Create a new static page for your website.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PageForm />
        </CardContent>
      </Card>
    </div>
  );
}
