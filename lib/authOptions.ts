import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';

export const authOptions: NextAuthOptions = {
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

          const user = result.rows[0];
          if (!user) return null;
          if (user.banned) return null;

          // Vérifier le verrouillage temporaire
          if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            // Non-bloquant : ces colonnes peuvent ne pas encore exister
            try {
              const attempts = (user.login_attempts || 0) + 1;
              if (attempts >= 5) {
                const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
                await pool.query(
                  'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
                  [0, lockedUntil, user.id]
                );
              } else {
                await pool.query(
                  'UPDATE users SET login_attempts = $1 WHERE id = $2',
                  [attempts, user.id]
                );
              }
            } catch { /* colonnes pas encore migrées */ }
            return null;
          }

          // Succès — reset les tentatives (non-bloquant si colonnes manquantes)
          let sessionToken: string | undefined;
          try {
            sessionToken = randomUUID();
            await pool.query(
              'UPDATE users SET session_token = $1, login_attempts = 0, locked_until = NULL WHERE id = $2',
              [sessionToken, user.id]
            );
          } catch { /* colonnes pas encore migrées — login quand même */ }

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
            if (row.banned) return { ...session, user: undefined };
            if (row.session_token && token.sessionToken !== row.session_token) {
              return { ...session, user: undefined };
            }
            (session.user as { plan?: string }).plan = row.plan;
          }
        } catch {
          (session.user as { plan?: string }).plan = token.plan as string;
        }
      }
      return session;
    },
  },
};
