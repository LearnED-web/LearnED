import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const getTokenFromSearch = (search) => {
  const params = new URLSearchParams(search);
  return (
    params.get('token') ||
    params.get('authToken') ||
    params.get('access_token') ||
    ''
  ).trim();
};

const DeleteAccount = () => {
  const location = useLocation();
  const tokenFromUrl = useMemo(() => getTokenFromSearch(location.search), [location.search]);
  const [requestToken, setRequestToken] = useState(tokenFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (tokenFromUrl) {
      // Remove token from URL after reading it once.
      window.history.replaceState({}, '', '/delete-account');
    }
  }, [tokenFromUrl]);

  const submitDeletionRequest = async () => {
    if (!requestToken) {
      setResult({
        type: 'error',
        message: 'Missing secure token. Please initiate account deletion from the LearnED mobile app.',
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration is missing.');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/request_account_deletion`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${requestToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => ({}));
      const success = Boolean(data?.success);

      if (success) {
        setResult({
          type: 'success',
          message:
            data?.message ||
            'Your account deletion request has been received successfully. Your account is now scheduled for deletion.',
          details: data,
        });
      } else {
        setResult({
          type: 'error',
          message:
            data?.message ||
            data?.error ||
            'Unable to submit deletion request. Please generate a fresh deletion link from the app and try again.',
          details: data,
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message:
          error?.message ||
          'Something went wrong while requesting account deletion. Please try again in a few minutes.',
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
            Request permanent account deletion without logging into the website. Use the secure link generated inside the LearnED app.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-red-100 p-6 md:p-8"
          >
            <div className="flex items-start gap-3 mb-6">
              <div className="p-3 rounded-xl bg-red-100 text-red-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Confirm Deletion Request</h2>
                <p className="text-gray-600 mt-1">
                  This request is irreversible after the retention period configured in your account deletion workflow.
                </p>
              </div>
            </div>

            {!requestToken && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex gap-3">
                <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm leading-relaxed">
                  No secure token found in this link. Please open the LearnED app and start account deletion from your profile/settings page to generate a valid link.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={submitDeletionRequest}
              disabled={isSubmitting || !requestToken}
              className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                isSubmitting || !requestToken
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Request Account Deletion'}
            </button>

            {result && (
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
                  {result.details?.code && (
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
              <li>Open LearnED mobile app and navigate to account settings.</li>
              <li>Tap the delete account option to generate a secure deletion link.</li>
              <li>Open the generated link, then submit the request here.</li>
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