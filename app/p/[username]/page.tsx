import { notFound } from "next/navigation";

import { PortfolioPageView } from "@/components/app/portfolio-page-view";
import { getPortfolioByUsername } from "@/lib/portfolio";

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const result = await getPortfolioByUsername(username);

  if (!result.data) {
    notFound();
  }

  return <PortfolioPageView data={result.data} />;
}
