/// <reference types="vite/client" />
import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const useClerk = Boolean(clerkKey && clerkKey.startsWith("pk_"));

export const startInstance = createStart(() => ({
  requestMiddleware: useClerk ? [clerkMiddleware()] : [],
}));
