import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (token.login) session.user.login = token.login as string
      return session
    },
    jwt({ token, profile }) {
      if (profile) token.login = (profile as { login?: string }).login
      return token
    },
  },
})
