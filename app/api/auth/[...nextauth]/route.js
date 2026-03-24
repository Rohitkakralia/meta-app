import NextAuth from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"

const handler = NextAuth({
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "email,public_profile,pages_read_engagement,pages_manage_metadata,pages_show_list"
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token, user }) {
      // Send properties to the client
      session.user.id = user.id
      return session
    },
    async jwt({ token, user, account, profile }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt"
  }
})

export { handler as GET, handler as POST }