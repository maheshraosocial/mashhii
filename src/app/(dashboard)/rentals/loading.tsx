import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function RentalsLoading() {
  return <PageSkeleton type="table" rows={6} />;
}
