import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected =
    (path.startsWith("/artist") &&
      !path.startsWith("/artist/login") &&
      !path.startsWith("/artist/signup") &&
      !path.startsWith("/artist/access") &&
      !path.startsWith("/artist/forgot-password")) ||
    (path.startsWith("/admin") && !path.startsWith("/admin/login")) ||
    (path.startsWith("/crew") &&
      !path.startsWith("/crew/login") &&
      !path.startsWith("/crew/signup"));

  if (isProtected && !user) {
    const portal = path.startsWith("/admin") ? "admin" : path.startsWith("/crew") ? "crew" : "artist";
    const url = request.nextUrl.clone();
    url.pathname = `/${portal}/login`;
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/webhooks|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
