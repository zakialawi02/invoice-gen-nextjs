"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Save } from "lucide-react";
import { useState } from "react";

export default function CreateNewInvoicePage() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-b pb-3">
        <div className="flex items-center justify-between md:justify-start w-full">
          <h1 className="text-2xl font-bold">Create New Invoice</h1>
          <span className="mx-3 hidden md:inline-block h-6 border-l-2 border-border"></span>
          <div className="flex items-center md:items-center space-x-2">
            <Label htmlFor="Show Preview">Show Preview</Label>
            <Switch id="Show Preview" checked={showPreview} onCheckedChange={setShowPreview} />
          </div>
        </div>

        <div className="flex items-center self-end space-x-2">
          <Button variant={"outline"}>Save as Draft</Button>
          <ButtonGroup>
            <Button>Save and Send</Button>
            <ButtonGroupSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" aria-label="More Options">
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Save />
                    Save Only
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Save />
                    Save and Send Invoice
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
}
