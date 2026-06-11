import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: "Access Denied",
};

export default function AccessDeniedPage() {
  return (
    <div className="w-full max-w-sm mx-auto px-4 text-center">
      <div className="flex flex-col items-center gap-6">
        <div className="size-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Access Denied
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-[260px] mx-auto">
            This account is not authorized to access {APP_NAME}. Only the
            registered owner account is allowed.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 text-left text-sm text-muted-foreground space-y-2 w-full">
          <p className="font-medium text-foreground text-xs uppercase tracking-wider">
            What happened?
          </p>
          <p>
            You signed in with a Google account that does not match the
            authorized email address for this application.
          </p>
          <p>
            {APP_NAME} is a private personal tool. If you are the owner, ensure
            you&apos;re signing in with the correct Google account.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-sm font-medium py-2 px-4 transition-colors"
        >
          ← Try a different account
        </Link>
      </div>
    </div>
  );
}
