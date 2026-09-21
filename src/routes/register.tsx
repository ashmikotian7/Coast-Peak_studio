import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "./login";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Coast & Peak Studio" }] }),
  component: () => <RegisterPage />,
});

function RegisterPage() {
  const { signup, signupWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phoneNumber.trim();

    if (!cleanName) {
      toast.error("Full name required", { description: "Please enter your full name." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error("Invalid email", { description: "Please provide a valid email address." });
      return;
    }

    if (password.length < 8) {
      toast.error("Password too short", { description: "Password must be at least 8 characters long for security." });
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("Passwords do not match", { description: "Please ensure password confirmation matches." });
      return;
    }

    setIsLoading(true);
    try {
      await signup(cleanName, cleanEmail, password, passwordConfirm, cleanPhone, country);
    } catch (err: unknown) {
      toast.error("Registration failed", {
        description: (err as Error)?.message || "Could not complete account registration.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async (email: string, fullName: string, googleToken?: string) => {
    setIsLoading(true);
    try {
      await signupWithGoogle(fullName, email, googleToken);
    } catch (err: unknown) {
      toast.error("Google signup failed", {
        description: (err as Error)?.message || "Could not complete account registration.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Begin your collection"
      subtitle="A few details and you're in"
      cta="Create account"
      alt={<>Already a collector? <Link to="/login" className="story-link">Sign in</Link></>}
      google
      onSubmit={handleSubmit}
      onGoogleSubmit={handleGoogleSignup}
      isLoading={isLoading}
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      fullName={fullName}
      onFullNameChange={setFullName}
      passwordConfirm={passwordConfirm}
      onPasswordConfirmChange={setPasswordConfirm}
      phoneNumber={phoneNumber}
      onPhoneNumberChange={setPhoneNumber}
      country={country}
      onCountryChange={setCountry}
    />
  );
}