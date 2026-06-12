import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function CaptureLoading() {
  return <PageSkeleton type="list" rows={6} />;
}
