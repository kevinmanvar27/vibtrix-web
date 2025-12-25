import NewCompetitionForm from "../components/NewCompetitionForm";

export const metadata = {
  title: "Create New Competition",
};

export default function NewCompetitionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Competition</h1>
        <p className="text-muted-foreground">
          Set up a new competition with customized rules and settings.
        </p>
      </div>

      <NewCompetitionForm />
    </div>
  );
}
