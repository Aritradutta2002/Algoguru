import type { Metadata } from "next";
import { BuyMeACoffeeView } from "@/features/support/BuyMeACoffeeView";

export const metadata: Metadata = {
  title: "Buy me a coffee — AlgoGuru",
  description: "Support AlgoGuru development and free coding interview resources.",
};

export default function BuyMeACoffeePage() {
  return <BuyMeACoffeeView />;
}
