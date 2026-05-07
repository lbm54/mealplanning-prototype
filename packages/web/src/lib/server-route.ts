/**
 * Type shim for createServerFileRoute.
 *
 * TanStack Start v1.167 does not export createServerFileRoute from
 * @tanstack/react-start/server. This shim provides a TypeScript-compatible
 * stub so tsc can type-check route files. At runtime the Vite plugin
 * recognises `ServerRoute` exports via file convention and handles
 * the HTTP method dispatch through the router's server.handlers path.
 *
 * See: https://tanstack.com/start/latest/docs/framework/react/api-routes
 */

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

type HandlerFn = (ctx: { request: Request; params: Record<string, string> }) => Response | Promise<Response>;

interface MethodsMap {
  [method: string]: HandlerFn;
}

interface ServerFileRouteBuilder {
  methods: (handlers: Partial<Record<HttpMethod | "ANY", HandlerFn>>) => MethodsMap;
}

/**
 * Type-safe wrapper around TanStack Start's server route convention.
 * The path argument is used for documentation only — the file name
 * determines the actual route path at runtime.
 */
export function createServerFileRoute(_path: string): ServerFileRouteBuilder {
  return {
    methods(handlers) {
      return handlers as MethodsMap;
    },
  };
}
