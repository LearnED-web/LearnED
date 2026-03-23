import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, LogIn, ShieldAlert, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const toDisplayText = (value) => {
  if (typeof value === 'string') return value;
  if (value === null || typeof value === 'undefined') return '';
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return String(value);
  }
};

const DeleteAccount = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
      if (data?.session?.user?.email) {
        setEmail(data.session.user.email);
      }
    };

    loadSession();

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    });

    return () => {
      authSub?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setResult(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      setUser(data?.user || null);
      setResult({
        type: 'success',
        message: 'Login successful. You can now request account deletion.',
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: error?.message || 'Unable to login. Please check your credentials.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPassword('');
    setConfirmText('');
    setResult(null);
  };

  const submitDeletionRequest = async () => {
    if (!user) {
      setResult({
        type: 'error',
        message: 'Please login first.',
      });
      return;
    }

    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setResult({
        type: 'error',
        message: 'Please type DELETE exactly to confirm account deletion.',
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || '').trim();
      const supabaseAnonKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();
      const deleteEndpoint = `${supabaseUrl}/functions/v1/process-due-account-purges`;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing in frontend env.');
      }

      if (!accessToken) {
        throw new Error('Your login session has expired. Please login again.');
      }

      const response = await fetch(deleteEndpoint, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id, email: user.email }),
      });

      const data = await response.json().catch(() => ({}));
      const success = response.ok && Boolean(data?.success);

      if (success) {
        setResult({
          type: 'success',
          message:
            data?.message ||
            'Your account deletion request has been processed successfully.',
          details: data,
        });
        setConfirmText('');
      } else {
        const fallbackMessage =
          response.status === 404
            ? `Edge function not found at ${deleteEndpoint}. Deploy process-due-account-purges function.`
            : 'Unable to delete account right now. Please try again in a few minutes.';

        const resolvedMessage =
          toDisplayText(data?.message) ||
          toDisplayText(data?.error) ||
          fallbackMessage;

        setResult({
          type: 'error',
          message: resolvedMessage,
          details: data,
        });
      }
    } catch (error) {
      const message = error?.message || '';
      const networkError = /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED/i.test(message);

      setResult({
        type: 'error',
        message: networkError
          ? 'Cannot reach Supabase edge function. Check network and Supabase URL.'
          : (error?.message || 'Something went wrong while deleting your account. Please try again in a few minutes.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-100 via-red-50 to-white">
      <section className="relative py-16 bg-gradient-to-br from-red-700 via-red-800 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Delete Account</h1>
          <p className="text-base md:text-lg max-w-3xl mx-auto text-red-100">
            Login with your student account, then confirm deletion by typing DELETE.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-md mx-auto md:max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-red-100 p-5 md:p-8"
          >
            <div className="flex items-start gap-3 mb-6">
              <div className="p-3 rounded-xl bg-red-100 text-red-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Confirm Deletion Request</h2>
                <p className="text-gray-600 mt-1">
                  This action is sensitive and may permanently erase your account data based on your backend purge policy.
                </p>
              </div>
            </div>

            {!user ? (
              <form onSubmit={login} className="space-y-4">
                <div>
                  <label htmlFor="delete-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="delete-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-300"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="delete-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="delete-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-300"
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    isLoggingIn
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
                  <p className="text-sm">
                    Logged in as <span className="font-semibold">{user.email}</span>
                  </p>
                </div>

                {result?.type === 'success' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Request Initiated</h3>
                    <p className="text-blue-800 mb-4">
                      Your account deletion request has been successfully submitted. Your account is now scheduled for permanent purging.
                    </p>
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex items-center justify-center px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      Logout
                    </button>
                    {result?.details?.scheduled_purge_at && (
                      <p className="text-xs text-blue-600 mt-4">
                        Estimated purge date: {new Date(result.details.scheduled_purge_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex gap-3">
                      <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">
                        Type <span className="font-bold">DELETE</span> to confirm permanent deletion request for this account.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmation text
                      </label>
                      <input
                        id="confirm-delete"
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-red-300"
                        placeholder="Type DELETE"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={submitDeletionRequest}
                      disabled={isSubmitting}
                      className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                        isSubmitting
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                      }`}
                    >
                      {isSubmitting ? 'Deleting...' : 'Delete My Account'}
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            )}

            {result && result.type !== 'success' && (
              <div
                className={`mt-6 rounded-xl p-4 border flex gap-3 ${
                  result.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {result.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">{result.message}</p>
                  {result.details?.error && (
                    <p className="text-sm mt-1 opacity-90">{toDisplayText(result.details.error)}</p>
                  )}
                  {result.details?.code && !result.details?.error && (
                    <p className="text-sm mt-1 opacity-90">Code: {result.details.code}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-red-100 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">How To Use This Page</h3>
            <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
              <li>Login with your student account credentials.</li>
              <li>Read the warning and type DELETE in the confirmation box.</li>
              <li>Tap Delete My Account to process your deletion request.</li>
            </ol>

            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-2">Need help?</p>
              <p>
                Contact support at{' '}
                <a href="mailto:support@learnedtech.in" className="text-red-700 hover:text-red-800 font-medium">
                  support@learnedtech.in
                </a>
                .
              </p>
              <p className="mt-3">
                Review our <Link to="/privacy-policy" className="text-red-700 hover:text-red-800">Privacy Policy</Link> and{' '}
                <Link to="/terms-of-service" className="text-red-700 hover:text-red-800">Terms of Service</Link>.
              </p>
            </div>
          </motion.aside>
        </div>
      </section>
    </div>
  );
};

export default DeleteAccount;