import { Suspense } from "react";
import MarketingHubClient from "./MarketingHubClient";

export const metadata = {
  title: "Marketing Hub",
};

export default function MarketingHubPage() {
  return (
    <Suspense>
      <MarketingHubClient />
    </Suspense>
  );
}
