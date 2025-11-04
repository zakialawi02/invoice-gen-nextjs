import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex items-center justify-center">
      <Skeleton className="w-full h-full p-10" />
    </div>
  );
}
