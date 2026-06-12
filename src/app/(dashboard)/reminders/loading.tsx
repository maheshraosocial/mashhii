import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function RemindersLoading() {
  return <PageSkeleton type="list" rows={6} />;
}
