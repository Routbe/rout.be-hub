import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy URL — account settings now live at /settings. */
export const Route = createFileRoute("/dashboard/account")({
  beforeLoad: () => {
    throw redirect({ to: "/settings" });
  },
});
