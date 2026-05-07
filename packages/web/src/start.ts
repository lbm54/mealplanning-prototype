/// <reference types="vite/client" />
import { createRouter } from "./router";

// Hydrate the client-side router when this module loads in the browser.
// On the server, Nitro's SSR entry handles things; this file is the Vite
// client entry referenced in index.html.
export { createRouter };
