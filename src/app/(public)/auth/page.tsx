import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInButton } from "@/components/auth-buttons";
import { authOptions, configuredAuthProviders } from "@/lib/auth";

export default async function AuthPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    return redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-10 px-6 py-16">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Sign in to your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose one of the available providers below to authenticate. You can configure providers
          via environment variables.
        </p>
      </div>

      <div className="space-y-3">
        {configuredAuthProviders.map((provider) => (
          <SignInButton
            key={provider.id}
            provider={provider.id}
            label={`Continue with ${provider.name}`}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have access yet? Contact your administrator or return to the{" "}
        <Link href="/" className="font-medium text-foreground hover:text-foreground">
          public site
        </Link>
        .
      </p>
    </div>
  );
}
