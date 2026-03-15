// middleware.js
// Protects the /app route — redirects to home page if not signed in

export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/app"],
};
