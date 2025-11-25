import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { createDraftInvoice } from "@/lib/invoice";

export default async function CreateNewInvoicePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth?callbackUrl=/dashboard/invoice/create");
  }

  const invoice = await createDraftInvoice(session.user.id);

  redirect(`/dashboard/invoice/create/${invoice.id}`);
}
