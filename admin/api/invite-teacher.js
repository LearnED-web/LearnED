const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS headers (needed for local dev / cross-origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Environment variables
  // REACT_APP_ vars are already in Vercel from your CRA setup
  // SUPABASE_SERVICE_ROLE_KEY must be added separately (no REACT_APP_ prefix = server-side only)
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error('Missing env vars:', {
      url: !!supabaseUrl,
      serviceRole: !!serviceRoleKey,
      anon: !!anonKey,
    });
    return res.status(500).json({
      error: 'Server configuration error: missing environment variables',
    });
  }

  // --- Verify the caller is an authenticated admin ---
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.replace('Bearer ', '');

  // Use admin client (service_role) to verify the caller's JWT and check admin status
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verify the JWT and get the calling user
  const {
    data: { user: callerUser },
    error: authError,
  } = await adminSupabase.auth.getUser(token);

  if (authError || !callerUser) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  // Verify caller is an admin
  const { data: adminRecord, error: adminError } = await adminSupabase
    .from('users')
    .select('user_type')
    .eq('id', callerUser.id)
    .single();

  if (adminError || adminRecord?.user_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // --- Parse request body ---
  const { email, redirectTo, userData } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // --- Send invitation using the "Invite User" email template ---
  // This is the KEY fix: inviteUserByEmail uses the "Invite User" template
  // which has {{ .ConfirmationURL }} (a clickable link), NOT the "Confirm Signup"
  // template which has {{ .Token }} (an OTP code).
  try {
    const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo:
          redirectTo || 'https://learnedtech.in/teacher/onboard',
        data: userData || {},
      }
    );

    if (error) {
      console.error('Supabase invite error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Teacher invite sent successfully to:', email);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
