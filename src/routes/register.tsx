import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "./login";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";

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
    setIsLoading(true);
    try {
      await signup(fullName, email, password, passwordConfirm, phoneNumber, country);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async (email: string, fullName: string) => {
    setIsLoading(true);
    try {
      await signupWithGoogle(fullName, email);
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