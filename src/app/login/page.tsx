"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Inloggen mislukt.");
      }

      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Inloggen mislukt.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen font-sans">
      {/* Left panel - black */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3 p-1.5">
              <Image
                src="/inc-logo.png"
                alt="INC logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold text-white">INC</h1>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl text-white mb-6 leading-tight">
              Praat met je digitale collega&apos;s.
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Log in om toegang te krijgen tot het INC chat platform.
            </p>
          </div>

          <div className="flex justify-between items-center text-white/70 text-sm">
            <span>© INC Collega Chat</span>
          </div>
        </div>
      </div>

      {/* Right panel - white form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center mx-auto mb-3 p-1.5">
              <Image
                src="/inc-logo.png"
                alt="INC logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold text-black">INC</h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl text-black">Welkom terug</h2>
              <p className="text-gray-600">
                Voer je wachtwoord in om de app te openen.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-black">
                  Wachtwoord
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Vul wachtwoord in"
                    className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-black"
                    required
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-600">{error}</p>
              ) : null}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-sm font-medium text-white bg-black hover:bg-black/90 hover:opacity-90 rounded-lg shadow-none cursor-pointer disabled:opacity-60"
              >
                {isLoading ? "Inloggen..." : "Inloggen"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
