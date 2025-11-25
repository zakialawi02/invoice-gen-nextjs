import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoiceEditorLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
        <Card className="p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
            {[...Array(2)].map((_, idx) => (
              <Card key={idx} className="p-3 border-dashed space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  {[...Array(3)].map((__, innerIdx) => (
                    <div key={innerIdx} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-10 w-24" />
              </Card>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
            <Skeleton className="h-10 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
