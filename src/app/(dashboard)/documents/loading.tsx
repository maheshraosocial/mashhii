import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function DocumentsLoading() {
  return <PageSkeleton type="list" rows={8} />;
}
