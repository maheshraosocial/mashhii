import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function NotesLoading() {
  return <PageSkeleton type="card" rows={6} />;
}
