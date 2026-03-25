import FacebookProvider from "next-auth/providers/facebook";

export const authOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            "email",
            "public_profile", 
            "pages_read_engagement",
            "pages_manage_metadata",
            "pages_show_list",
            "whatsapp_business_management",
            "whatsapp_business_messaging",
            "business_management"
          ].join(","),
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // With JWT strategy, get user info from token
      if (token) {
        session.user.id = token.sub;
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};
