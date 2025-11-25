"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { CreateInvoiceButton } from "../create-invoice-button";

export default function CreateNewInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Create New Invoice</h1>
        <p className="text-sm text-muted-foreground">
          Start a draft invoice to personalize biller details, items, preview the document, and download it as a PDF.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start from a fresh draft</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We will create a draft invoice record and redirect you to its unique builder URL so you can continue editing later.
          </p>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Generate invoice draft</p>
              <p className="text-sm text-muted-foreground">
                A dedicated ID will be reserved immediately with loading feedback during registration.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CreateInvoiceButton label="Create & Continue" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
