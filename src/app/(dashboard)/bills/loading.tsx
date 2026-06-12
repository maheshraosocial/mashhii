import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function BillsLoading() {
  return <PageSkeleton type="table" rows={8} />;
}
