import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Protection anti-bruteforce basique
        if (credentials.password.length > 100) return null;
        if (credentials.email.length > 255) return null;

        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [credentials.email]
        );

        const user = result.rows[0];
        if (!user) return null;

        // Vérifier si l'utilisateur est banni
        if (user.banned) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.plan = (user as any).plan;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).plan = token.plan;
      return session;
    },
  },
});

export { handler as GET, handler as POST };