import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
  createAuthToken,
  getExpectedPassword,
} from "@/lib/auth";

interface LoginBody {
  password?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const password = body.password?.trim();

    if (!password) {
      return NextResponse.json(
        { error: "Wachtwoord is verplicht." },
        { status: 400 },
      );
    }

    const expected = getExpectedPassword();
    if (password !== expected) {
      return NextResponse.json(
        { error: "Onjuist wachtwoord." },
        { status: 401 },
      );
    }

    const token = await createAuthToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login route failure", error);
    return NextResponse.json(
      { error: "Login mislukt." },
      { status: 500 },
    );
  }
}

