// pages/api/auth/[...nextauth].js
// Google OAuth — requests Gmail + Calendar scopes so the MCP servers can act on the user's behalf

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Request offline access so we get a refresh token
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "email",
            "profile",
            // Gmail — needed for the Gmail MCP to create drafts
            "https://www.googleapis.com/auth/gmail.compose",
            // Google Calendar — needed for the Calendar MCP to create events
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
        },
      },
    }),
  ],

  callbacks: {
    // Persist the Google access token and refresh token in the JWT
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at * 1000;
      }

      // Return the token if it hasn't expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired — attempt to refresh it
      return await refreshAccessToken(token);
    },

    // Expose the access token to the client session so pages/api/agent.js can use it
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },

  pages: {
    signIn: "/", // Redirect to landing page on sign-in
  },
};

// Refresh an expired Google access token using the refresh token
async function refreshAccessToken(token) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, { method: "POST" });
    const refreshed = await response.json();

    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export default NextAuth(authOptions);
