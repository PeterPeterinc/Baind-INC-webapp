"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    <div className="flex min-h-screen items-center justify-center bg-[--background] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#e4d8c7] bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/inc-logo.png"
            alt="INC logo"
            width={64}
            height={64}
            className="mb-4 h-16 w-16"
            priority
          />
          <h1 className="text-2xl font-semibold text-[#1f1a12]">
            Inloggen
          </h1>
          <p className="mt-1 text-sm text-[#8a7b64]">
            Voer het wachtwoord in om de app te openen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-[#1f1a12]"
            >
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#e4d8c7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#dabb7b] focus:ring-2 focus:ring-[#f9c646]/30"
              placeholder="Vul wachtwoord in"
              autoFocus
              required
            />
          </div>

          {error ? (
            <p className="text-sm font-medium text-[#a83b2d]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#1f1a12] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#433b31] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Inloggen..." : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}

