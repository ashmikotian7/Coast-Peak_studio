import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Coast & Peak Studio" }] }),
  component: () => (
    <AuthShell
      title="Begin your collection"
      subtitle="A few details and you're in"
      cta="Create account"
      alt={<>Already a collector? <Link to="/login" className="story-link">Sign in</Link></>}
      google
    />
  ),
});
