'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let success;
      if (isLogin) {
        success = await login(email, password);
        if (!success) setError('Invalid email or password');
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        success = await register(email, name, password);
        if (!success) setError('Registration failed. Email may already be in use.');
      }

      if (success) {
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 p-2 rounded-lg transition-colors ${
          theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 shadow-md'
        }`}
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg ${
            theme === 'dark' ? 'bg-blue-600 shadow-blue-600/30' : 'bg-blue-600 shadow-blue-600/30'
          }`}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>API Saurus</h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>API Documentation & Testing Platform</p>
        </div>

        <div className={`backdrop-blur-sm border rounded-2xl p-8 shadow-xl ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex mb-6 rounded-lg p-1 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin ? 'bg-blue-600 text-white shadow-md' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin ? 'bg-blue-600 text-white shadow-md' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
