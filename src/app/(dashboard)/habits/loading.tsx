import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function HabitsLoading() {
  return <PageSkeleton type="habits" rows={6} />;
}
