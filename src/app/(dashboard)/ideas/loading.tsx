import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function IdeasLoading() {
  return <PageSkeleton type="card" rows={6} />;
}
