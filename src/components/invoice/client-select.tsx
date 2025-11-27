"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ClientDialog } from "./client-dialog";
import { ClientFormData } from "@/lib/validations/client";

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}

interface ClientSelectProps {
  value?: string;
  onSelect: (client: Client | null) => void;
}

export function ClientSelect({ value, onSelect }: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  // const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);

        const response = await fetch(`/api/clients?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setClients(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      }
    };

    fetchClients();
  }, [search, open]); // Refetch when opening to get latest

  const handleClientCreated = (newClient: ClientFormData & { id: string }) => {
    // Convert ClientFormData to Client structure (handling optional/null differences if any)
    const client: Client = {
      id: newClient.id,
      name: newClient.name,
      email: newClient.email || null,
      company: newClient.company || null,
      phone: newClient.phone || null,
      address: newClient.address || null,
      city: newClient.city || null,
      state: newClient.state || null,
      zip: newClient.zip || null,
      country: newClient.country || null,
    };

    setClients((prev) => [client, ...prev]);
    onSelect(client);
    setOpen(false);
  };

  const selectedClient = clients.find((client) => client.id === value);

  return (
    <div className="flex items-center space-x-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-3"
          >
            {selectedClient ? (
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold">{selectedClient.name}</span>
                {selectedClient.email && (
                  <span className="text-xs text-muted-foreground">{selectedClient.email}</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Select a client...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search clients..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No clients found.</CommandEmpty>
              <CommandGroup heading="Clients">
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => {
                      onSelect(client.id === value ? null : client);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{client.name}</span>
                      {client.email && (
                        <span className="text-xs text-muted-foreground">{client.email}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setDialogOpen(true);
                    setOpen(false);
                  }}
                  className="cursor-pointer text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Client
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
