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
        if (credentials.password.length > 100) return null;
        if (credentials.email.length > 255) return null;

        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [credentials.email]
        );

        const user = result.rows[0];
        if (!user) return null;
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
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.plan = (user as { plan?: string }).plan;
      return token;
    },
    async session({ session, token }) {
      // Relit TOUJOURS le plan depuis la base — pas de reconnexion nécessaire
      if (session.user?.email) {
        try {
          const result = await pool.query(
            'SELECT plan, banned FROM users WHERE email = $1',
            [session.user.email]
          );
          if (result.rows.length > 0) {
            (session.user as { plan?: string }).plan = result.rows[0].plan;
            // Si banni, on vide la session
            if (result.rows[0].banned) {
              return { ...session, user: undefined };
            }
          }
        } catch (e) {
          // Fallback sur le token si la DB est indisponible
          (session.user as { plan?: string }).plan = token.plan as string;
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };