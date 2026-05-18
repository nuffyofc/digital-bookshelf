import AdminDashboard from "@/components/AdminDashboard";
import { getAllSummaries } from "@/lib/summaries";

export const metadata = {
  title: "Admin • Digital Bookshelf",
  description: "Upload and manage Markdown summaries.",
};

export default async function AdminPage() {
  const summaries = await getAllSummaries();
  return <AdminDashboard initialSummaries={summaries} />;
}
