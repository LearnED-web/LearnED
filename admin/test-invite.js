// Diagnostic + test script for teacher invitation
// Run: node test-invite.js <teacher-email>

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing env vars. Make sure .env has REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const testEmail = process.argv[2];
if (!testEmail) {
  console.error('❌ Usage: node test-invite.js <teacher-email>');
  console.error('   Example: node test-invite.js teacher@example.com');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnoseAndTest() {
  console.log('🔧 Supabase URL:', supabaseUrl);
  console.log('🔑 Service Role Key:', serviceRoleKey.substring(0, 20) + '...');
  console.log('📧 Test email:', testEmail);
  console.log('');

  // ===== STEP 1: Check if user already exists in auth =====
  console.log('━━━ STEP 1: Checking if user already exists in auth.users ━━━');
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Cannot list users:', listError.message);
  } else {
    const existingUser = existingUsers.users.find(u => u.email === testEmail);
    if (existingUser) {
      console.log('⚠️  User ALREADY EXISTS in auth.users!');
      console.log('   ID:', existingUser.id);
      console.log('   Created:', existingUser.created_at);
      console.log('   Confirmed:', existingUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('   Metadata:', JSON.stringify(existingUser.user_metadata));
      console.log('');
      console.log('🗑️  Deleting existing user so we can test a fresh invite...');
      const { error: delError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (delError) {
        console.error('❌ Failed to delete existing user:', delError.message);
        console.log('   You may need to manually delete this user from Supabase dashboard');
        console.log('   Go to: Authentication > Users > find the email > delete');
        return;
      }
      console.log('✅ Existing user deleted');
      // Also clean up public.users if exists
      await supabase.from('users').delete().eq('id', existingUser.id);
      console.log('✅ Cleaned up public.users record too');
    } else {
      console.log('✅ User does NOT exist yet — good');
    }
  }
  console.log('');

  // ===== STEP 2: Check the trigger function =====
  console.log('━━━ STEP 2: Checking handle_new_user_signup trigger ━━━');
  const { data: triggerCheck, error: triggerError } = await supabase
    .rpc('handle_new_user_signup_check', {})
    .maybeSingle();
  
  // This RPC won't exist — that's fine. Let's just check trigger_logs
  const { data: recentLogs, error: logError } = await supabase
    .from('trigger_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentLogs && recentLogs.length > 0) {
    console.log('📋 Recent trigger logs:');
    recentLogs.forEach(log => {
      console.log(`   [${log.created_at}] ${log.message} ${log.error_message ? '❌ ' + log.error_message : ''}`);
    });
  } else {
    console.log('   No recent trigger logs found');
  }
  console.log('');

  // ===== STEP 3: Create invitation record first (like admin panel does) =====
  console.log('━━━ STEP 3: Creating invitation record via RPC ━━━');
  
  // Find an admin user to use as the inviter
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('user_type', 'admin')
    .limit(1)
    .single();

  if (!adminUser) {
    console.error('❌ No admin user found in users table. Cannot create invitation.');
    return;
  }
  console.log('👤 Using admin:', adminUser.email, '(' + adminUser.id + ')');

  // Use the same RPC the admin panel uses
  const { data: invResult, error: invError } = await supabase.rpc('create_teacher_invitation', {
    p_email: testEmail,
    p_first_name: 'Test',
    p_last_name: 'Teacher',
    p_subject: null,
    p_grade_levels: null,
    p_admin_id: adminUser.id
  });

  if (invError) {
    console.error('❌ Failed to create invitation via RPC:', invError.message);
    console.log('   This means the create_teacher_invitation function has an issue.');
    return;
  }
  console.log('✅ Invitation created:', JSON.stringify(invResult));
  console.log('');

  // ===== STEP 4: Try the invite =====
  console.log('━━━ STEP 4: Sending invitation via inviteUserByEmail ━━━');
  console.log('🔗 Redirect:', 'https://learnedtech.in/teacher/onboard');
  console.log('');

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(testEmail, {
    redirectTo: 'https://learnedtech.in/teacher/onboard',
    data: {
      user_type: 'teacher',
      first_name: 'Test',
      last_name: 'Teacher',
    }
  });

  if (error) {
    console.error('❌ INVITE FAILED:', error.message);
    console.error('   Status:', error.status);
    console.error('');
    
    if (error.message.includes('Database error saving new user')) {
      console.log('🔍 ROOT CAUSE: Your handle_new_user_signup trigger is BLOCKING teacher creation.');
      console.log('');
      console.log('   The trigger sees user_type="teacher" and raises an exception.');
      console.log('   You need to run the fix SQL in your Supabase SQL Editor.');
      console.log('');
      console.log('   ⬇️  Copy and paste THIS SQL into Supabase Dashboard > SQL Editor > New Query:');
      console.log('');
      printFixSQL();
    }
  } else {
    console.log('✅ INVITE SENT SUCCESSFULLY!');
    console.log('   User ID:', data.user?.id);
    console.log('   Email:', data.user?.email);
    console.log('');
    console.log('👉 Check the email inbox for', testEmail);
    console.log('   It should contain a CLICKABLE LINK (not an OTP code)');
    console.log('   The link should redirect to: https://learnedtech.in/teacher/onboard');
  }

  // Check trigger logs again after the attempt
  console.log('');
  console.log('━━━ Trigger logs AFTER invite attempt ━━━');
  const { data: afterLogs } = await supabase
    .from('trigger_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (afterLogs && afterLogs.length > 0) {
    afterLogs.forEach(log => {
      console.log(`   [${log.created_at}] ${log.message} ${log.error_message ? '❌ ' + log.error_message : ''}`);
    });
  }
}

function printFixSQL() {
  console.log(`-- Run this in Supabase Dashboard > SQL Editor
-- It updates the trigger to ALLOW teacher creation when a valid invitation exists

CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    user_type_val text;
    student_id_val text;
    has_valid_invitation boolean;
BEGIN
    INSERT INTO public.trigger_logs (message, metadata)
    VALUES ('handle_new_user_signup triggered', jsonb_build_object('user_id', NEW.id, 'email', NEW.email));

    user_type_val := COALESCE(NEW.raw_user_meta_data->>'user_type', 'student');
    
    IF user_type_val = 'teacher' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.teacher_invitations 
            WHERE email = NEW.email 
            AND status = 'pending' 
            AND expires_at > now()
        ) INTO has_valid_invitation;
        
        IF NOT has_valid_invitation THEN
            INSERT INTO public.trigger_logs (message, error_message, metadata)
            VALUES ('Teacher registration blocked', 'No valid invitation found', jsonb_build_object('user_id', NEW.id, 'email', NEW.email));
            RAISE EXCEPTION 'Teacher registration requires a valid invitation.';
        END IF;
        
        INSERT INTO public.trigger_logs (message, metadata)
        VALUES ('Teacher registration allowed - valid invitation found', jsonb_build_object('user_id', NEW.id, 'email', NEW.email));
    END IF;

    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('user_type', user_type_val)
    WHERE id = NEW.id;

    IF user_type_val != 'teacher' THEN
        INSERT INTO public.users (
            id, email, user_type, first_name, last_name, 
            email_confirmed_at, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.email, user_type_val::public.user_type,
            COALESCE(NEW.raw_user_meta_data->>'first_name', 'Unknown'),
            COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
            NEW.email_confirmed_at, NEW.created_at, NEW.updated_at
        );
    ELSE
        INSERT INTO public.trigger_logs (message, metadata)
        VALUES ('Skipping public.users insert for teacher - will be created during onboarding', 
                jsonb_build_object('user_id', NEW.id, 'email', NEW.email));
    END IF;

    IF user_type_val = 'student' THEN
        student_id_val := 'STU' || to_char(now(), 'YYYYMMDD') || substr(NEW.id::text, 1, 6);
        INSERT INTO public.students (
            user_id, student_id, grade_level, board, status, created_at, updated_at
        ) VALUES (
            NEW.id, student_id_val,
            (NEW.raw_user_meta_data->>'grade_level')::integer,
            NEW.raw_user_meta_data->>'board',
            'active', now(), now()
        );
    END IF;

    INSERT INTO public.trigger_logs (message, metadata)
    VALUES ('User signup completed successfully', jsonb_build_object('user_id', NEW.id, 'user_type', user_type_val));

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.trigger_logs (message, error_message, metadata)
        VALUES ('Error in handle_new_user_signup', SQLERRM, jsonb_build_object('user_id', NEW.id, 'email', NEW.email));
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
}

diagnoseAndTest();
