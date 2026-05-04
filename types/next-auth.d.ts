import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      createdAt: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    createdAt?: string;
  }
}
