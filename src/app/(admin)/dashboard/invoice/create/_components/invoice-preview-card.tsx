import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanEye } from "lucide-react";

export default function InvoicePreviewCard({ showPreview = false }: { showPreview?: boolean }) {
  return (
    <Card className={`w-full ${showPreview ? "md:max-w-1/2" : "hidden w-10!"}`}>
      <CardHeader>
        <CardTitle>
          <span className="mr-2 inline-flex items-center">
            <span className="bg-primary/10 p-2 rounded-full mr-2">
              <ScanEye className="h-4 w-4 text-primary" />
            </span>
            Preview
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h2>Preview Here</h2>
      </CardContent>
    </Card>
  );
}
