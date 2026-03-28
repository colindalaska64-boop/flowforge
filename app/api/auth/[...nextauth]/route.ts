import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
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

        try {
          const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [credentials.email]
          );

          console.log('[AUTH] rows found:', result.rows.length, 'for', credentials.email);

          const user = result.rows[0];
          if (!user) { console.log('[AUTH] user not found'); return null; }
          if (user.banned) { console.log('[AUTH] user banned'); return null; }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('[AUTH] passwordMatch:', passwordMatch);

          if (!passwordMatch) return null;

          const sessionToken = randomUUID();
          await pool.query(
            'UPDATE users SET session_token = $1 WHERE id = $2',
            [sessionToken, user.id]
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
            sessionToken,
          };
        } catch (e) {
          console.error('[AUTH] DB error:', e);
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.plan = (user as { plan?: string }).plan;
        token.sessionToken = (user as { sessionToken?: string }).sessionToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Relit TOUJOURS le plan depuis la base — pas de reconnexion nécessaire
      if (session.user?.email) {
        try {
          const result = await pool.query(
            'SELECT plan, banned, session_token FROM users WHERE email = $1',
            [session.user.email]
          );
          if (result.rows.length > 0) {
            const row = result.rows[0];
            // Si banni, on vide la session
            if (row.banned) return { ...session, user: undefined };
            // Si le token ne correspond pas → quelqu'un d'autre s'est connecté
            if (row.session_token && token.sessionToken !== row.session_token) {
              return { ...session, user: undefined };
            }
            (session.user as { plan?: string }).plan = row.plan;
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