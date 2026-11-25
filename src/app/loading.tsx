import { AppLoadingScreen } from "@/components/layout/RouteFallback";

export default function Loading() {
  return (
    <AppLoadingScreen
      label="Loading your workspace"
      sublabel="Preparing editor, tracks, and session state"
    />
  );
}
