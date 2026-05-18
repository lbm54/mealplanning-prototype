/**
 * Landing — there's no landing anymore; the app opens straight onto the
 * mobile plan screen.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/plan/a" });
  },
});
