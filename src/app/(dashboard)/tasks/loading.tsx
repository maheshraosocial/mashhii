import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function TasksLoading() {
  return <PageSkeleton type="table" rows={8} />;
}
