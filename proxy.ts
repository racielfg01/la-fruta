import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "la-fruta-admin-secret-change-in-production"
);

const adminLoginPath = "/admin/login";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname !== adminLoginPath &&
    !pathname.startsWith(adminLoginPath + "/") &&
    !pathname.startsWith("/_next")
  ) {
    const token = request.cookies.get("admin_token");

    if (token?.value) {
      try {
        const { payload } = await jwtVerify(token.value, secret);
        if (payload.role === "admin") {
          return NextResponse.next();
        }
      } catch {
        // Token invalid, fall through to redirect
      }
    }

    const loginUrl = new URL(adminLoginPath, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
