import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <Dashboard />
    </div>
  );
}
