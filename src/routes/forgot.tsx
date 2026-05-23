import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "./login";

export const Route = createFileRoute("/forgot")({
  head: () => ({ meta: [{ title: "Reset password — SK" }] }),
  component: () => (
    <AuthShell
      title="Forgotten?"
      subtitle="We'll send a reset link to your email"
      cta="Send reset link"
      alt={<>Remembered? <Link to="/login" className="story-link">Sign in</Link></>}
    />
  ),
});
