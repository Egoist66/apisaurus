import NextAuth, { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByEmail, serializeAuthUser, verifyPassword } from '@/lib/auth';

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await findUserByEmail(email);
        if (!user) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return serializeAuthUser(user);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.createdAt = user.createdAt;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.email) {
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.name = token.name ?? '';
        session.user.createdAt = typeof token.createdAt === 'string' ? token.createdAt : new Date().toISOString();
      }

      return session;
    },
  },
};

export const nextAuthHandler = NextAuth(authOptions);

export function auth() {
  return getServerSession(authOptions);
}
