import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { logLoginAttempt } from '@/lib/loginAudit';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        if (credentials.password.length > 100) return null;
        if (credentials.email.length > 255) return null;

        // Rate limit par IP : 10 tentatives / 10 min
        const fwd = (req?.headers as Record<string, string> | undefined)?.['x-forwarded-for'];
        const ip = fwd?.split(',')[0]?.trim() || 'unknown';
        const rl = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
        if (!rl.allowed) {
          logLoginAttempt({ email: credentials.email, ip, success: false, reason: 'rate_limited' });
          return null;
        }

        try {
          const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [credentials.email]
          );

          const user = result.rows[0];
          if (!user) {
            logLoginAttempt({ email: credentials.email, ip, success: false, reason: 'unknown_user' });
            return null;
          }
          if (user.banned) {
            logLoginAttempt({ email: credentials.email, ip, success: false, reason: 'banned' });
            return null;
          }

          // Bloquer si email non vérifié (colonne peut ne pas exister encore → on laisse passer)
          if (user.email_verified === false) {
            logLoginAttempt({ email: credentials.email, ip, success: false, reason: 'email_not_verified' });
            throw new Error("email_not_verified");
          }

          // Vérifier le verrouillage temporaire
          if (user.locked_until && new Date(user.locked_until) > new Date()) {
            logLoginAttempt({ email: credentials.email, ip, success: false, reason: 'locked' });
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            logLoginAttempt({ email: credentials.email, ip, success: false, reason: 'bad_password' });
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
            const newToken = randomUUID();
            await pool.query(
              'UPDATE users SET session_token = $1, login_attempts = 0, locked_until = NULL WHERE id = $2',
              [newToken, user.id]
            );
            sessionToken = newToken; // seulement si l'UPDATE a réussi
          } catch { /* colonnes pas encore migrées — login quand même */ }

          logLoginAttempt({ email: credentials.email, ip, success: true });

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
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    ] : []),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const existing = await pool.query('SELECT id, banned FROM users WHERE email = $1', [user.email]);
          if (existing.rows.length > 0) {
            if (existing.rows[0].banned) return false;
            // Update session token
            const sessionToken = randomUUID();
            await pool.query(
              'UPDATE users SET session_token = $1, login_attempts = 0, locked_until = NULL WHERE id = $2',
              [sessionToken, existing.rows[0].id]
            );
            return true;
          }
          // Create new user from Google
          const sessionToken = randomUUID();
          await pool.query(
            'INSERT INTO users (name, email, password, plan, session_token) VALUES ($1, $2, $3, $4, $5)',
            [user.name || 'Utilisateur', user.email, 'google-oauth', 'free', sessionToken]
          );
          return true;
        } catch (e) {
          console.error('[AUTH] Google signIn error:', e);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'google') {
          // Fetch plan and sessionToken from DB for Google users
          try {
            const result = await pool.query('SELECT plan, session_token FROM users WHERE email = $1', [user.email]);
            if (result.rows.length > 0) {
              token.plan = result.rows[0].plan;
              token.sessionToken = result.rows[0].session_token;
            }
          } catch {
            token.plan = 'free';
          }
        } else {
          token.plan = (user as { plan?: string }).plan;
          token.sessionToken = (user as { sessionToken?: string }).sessionToken;
        }
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
            if (row.session_token && token.sessionToken && token.sessionToken !== row.session_token) {
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
