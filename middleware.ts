// middleware.ts
import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isAuthPage = pathname === "/login" || pathname === "/signup"

  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/statistical-analysis", req.nextUrl))
    }
    return
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }
})

export const config = {
  matcher: [
    "/statistical-analysis/:path*",
    "/upload/:path*",
    "/insights/:path*",
    "/chat/:path*",
    "/login",
    "/signup"
  ]
}
