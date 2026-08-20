import AppGate from "./app-gate";

// Rendered per-request: authentication and the dashboard both run
// entirely in the browser via Firebase, so there is nothing useful to
// statically prerender on the server for this route.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <AppGate />;
}
