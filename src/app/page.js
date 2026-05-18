import Bookshelf from "@/components/Bookshelf";
import { getAllSummaries } from "@/lib/summaries";

export const metadata = {
  title: "Digital Bookshelf",
  description: "A searchable library of Markdown book summaries.",
};

export default async function Home() {
  const summaries = await getAllSummaries();
  return <Bookshelf initialSummaries={summaries} />;
}
