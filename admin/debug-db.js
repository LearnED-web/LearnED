const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

(async () => {
  console.log('=== Checking users table ===');
  const { data, error } = await sb.from('users').select('id, email, user_type').limit(5);
  console.log('Error:', error?.message || 'none');
  console.log('Data:', data);

  console.log('\n=== Checking auth.users ===');
  const { data: authUsers } = await sb.auth.admin.listUsers();
  if (authUsers && authUsers.users) {
    console.log('Total auth users:', authUsers.users.length);
    authUsers.users.forEach(u => {
      console.log('  ', u.email, '|', u.user_metadata?.user_type || 'no-type', '|', u.id);
    });
  }

  console.log('\n=== Checking teacher_invitations ===');
  const { data: invites, error: invErr } = await sb.from('teacher_invitations').select('*').limit(5);
  console.log('Error:', invErr?.message || 'none');
  console.log('Invitations:', invites);
})();
