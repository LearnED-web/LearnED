const { createClient } = require('@supabase/supabase-js');

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

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
  const { email, redirectTo, userData, invitationData, reinvite = false } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const firstName = (invitationData?.first_name || userData?.first_name || '').trim();
  const lastName = (invitationData?.last_name || userData?.last_name || '').trim();
  const subject = invitationData?.subject || null;
  const gradeLevels = Array.isArray(invitationData?.grade_levels)
    ? invitationData.grade_levels.filter((level) => Number.isInteger(level))
    : null;

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  // Block inviting if this email already belongs to a student or an onboarded teacher.
  const { data: userRecord, error: userLookupError } = await adminSupabase
    .from('users')
    .select('id, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (userLookupError) {
    console.error('User lookup error:', userLookupError);
    return res.status(500).json({ error: 'Failed to validate email' });
  }

  if (userRecord?.id) {
    const { data: studentRecord, error: studentLookupError } = await adminSupabase
      .from('students')
      .select('id')
      .eq('user_id', userRecord.id)
      .maybeSingle();

    if (studentLookupError) {
      console.error('Student lookup error:', studentLookupError);
      return res.status(500).json({ error: 'Failed to validate student conflict' });
    }

    if (studentRecord?.id) {
      return res.status(409).json({
        errorCode: 'STUDENT_EMAIL_CONFLICT',
        error: 'This email is already used by a student. Please use another email.',
      });
    }

    const { data: teacherRecord, error: teacherLookupError } = await adminSupabase
      .from('teachers')
      .select('id')
      .eq('user_id', userRecord.id)
      .maybeSingle();

    if (teacherLookupError) {
      console.error('Teacher lookup error:', teacherLookupError);
      return res.status(500).json({ error: 'Failed to validate teacher conflict' });
    }

    if (teacherRecord?.id) {
      return res.status(409).json({
        errorCode: 'ALREADY_TEACHER',
        error: 'This email already belongs to a teacher account.',
      });
    }
  }

  const { data: existingInvitation, error: inviteLookupError } = await adminSupabase
    .from('teacher_invitations')
    .select('id, status')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (inviteLookupError) {
    console.error('Invitation lookup error:', inviteLookupError);
    return res.status(500).json({ error: 'Failed to check existing invitation' });
  }

  if (existingInvitation?.id && existingInvitation.status === 'accepted') {
    return res.status(409).json({
      errorCode: 'INVITATION_ALREADY_ACCEPTED',
      error: 'This teacher invitation is already accepted.',
    });
  }

  if (existingInvitation?.id && !reinvite) {
    return res.status(409).json({
      errorCode: 'INVITATION_EXISTS',
      canReinvite: true,
      error: 'An invitation already exists for this email. Re-invite to send a fresh link?',
    });
  }

  let invitationId;
  let inviteType = 'new';

  if (existingInvitation?.id && reinvite) {
    const { data: updatedInvitation, error: updateInviteError } = await adminSupabase
      .from('teacher_invitations')
      .update({
        first_name: firstName,
        last_name: lastName,
        subject,
        grade_levels: gradeLevels,
        invited_by: callerUser.id,
        status: 'pending',
        expires_at: addDays(7),
        accepted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingInvitation.id)
      .select('id')
      .single();

    if (updateInviteError) {
      console.error('Re-invite update error:', updateInviteError);
      return res.status(500).json({ error: 'Failed to re-invite teacher' });
    }

    invitationId = updatedInvitation.id;
    inviteType = 'resent';
  } else {
    const { data: createdInvitation, error: createInviteError } = await adminSupabase
      .from('teacher_invitations')
      .insert({
        email: normalizedEmail,
        first_name: firstName,
        last_name: lastName,
        subject,
        grade_levels: gradeLevels,
        invited_by: callerUser.id,
        status: 'pending',
        expires_at: addDays(7),
      })
      .select('id')
      .single();

    if (createInviteError) {
      // Handle race condition where another invite was inserted after our lookup.
      if (createInviteError.code === '23505') {
        return res.status(409).json({
          errorCode: 'INVITATION_EXISTS',
          canReinvite: true,
          error: 'An invitation already exists for this email. Re-invite to send a fresh link?',
        });
      }

      console.error('Invitation create error:', createInviteError);
      return res.status(500).json({ error: 'Failed to create invitation' });
    }

    invitationId = createdInvitation.id;
  }

  // --- Send invitation using the "Invite User" email template ---
  // This is the KEY fix: inviteUserByEmail uses the "Invite User" template
  // which has {{ .ConfirmationURL }} (a clickable link), NOT the "Confirm Signup"
  // template which has {{ .Token }} (an OTP code).
  try {
    const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        redirectTo:
          redirectTo || 'https://learnedtech.in/teacher/onboard',
        data: {
          ...(userData || {}),
          user_type: 'teacher',
          first_name: firstName,
          last_name: lastName,
          invitation_id: invitationId,
        },
      }
    );

    if (error) {
      console.error('Supabase invite error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Teacher invite sent successfully to:', normalizedEmail, 'type:', inviteType);
    return res.status(200).json({
      success: true,
      inviteType,
      invitation_id: invitationId,
      data,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
