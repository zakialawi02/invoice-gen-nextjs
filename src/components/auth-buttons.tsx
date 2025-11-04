"use client";

import { signIn, signOut } from "next-auth/react";

type SignInButtonProps = {
  provider: string;
  label: string;
};

export function SignInButton({ provider, label }: SignInButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signIn(provider)}
      className="flex w-full items-center justify-center rounded-md border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
    >
      {label}
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
    >
      Sign out
    </button>
  );
}
