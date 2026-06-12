import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function GoalsLoading() {
  return <PageSkeleton type="goals" rows={4} />;
}
