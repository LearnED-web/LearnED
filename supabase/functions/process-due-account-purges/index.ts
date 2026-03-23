import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const CRON_SHARED_SECRET = Deno.env.get('CRON_SHARED_SECRET');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';

  if (!bearerToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized: missing bearer token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const limit = Number.isInteger(body?.limit) ? body.limit : 50;
    const targetUserId = typeof body?.user_id === 'string' ? body.user_id : null;
    const targetEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : null;

    const cronToken = CRON_SHARED_SECRET ?? '';
    const isAdminInvocation = bearerToken === cronToken || bearerToken === SUPABASE_SERVICE_ROLE_KEY;

    let resolvedUserId: string | null = targetUserId;
    let accountInfo: Record<string, unknown> | null = null;

    if (!isAdminInvocation) {
      const { data: userData, error: userError } = await adminClient.auth.getUser(bearerToken);
      const authUser = userData?.user;

      if (userError || !authUser?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized: invalid user token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (targetUserId && targetUserId !== authUser.id) {
        return new Response(JSON.stringify({ error: 'Forbidden: cannot purge another user account' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      resolvedUserId = authUser.id;
      accountInfo = {
        id: authUser.id,
        email: authUser.email ?? null,
      };
    }

    if (!resolvedUserId && targetEmail) {
      const { data: userRow, error: userError } = await adminClient
        .from('users')
        .select('id, email, deletion_status, scheduled_purge_at')
        .eq('email', targetEmail)
        .maybeSingle();

      if (userError) {
        return new Response(JSON.stringify({ error: userError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!userRow) {
        return new Response(JSON.stringify({ error: `No user found for email: ${targetEmail}` }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      resolvedUserId = userRow.id;
      accountInfo = userRow;
    }

    if (!resolvedUserId) {
      return new Response(JSON.stringify({ error: 'No target user resolved for purge request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Student/app invocation: use existing RPC pipeline that handles
    // request creation and account state transitions according to DB policies.
    if (!isAdminInvocation) {
      if (!SUPABASE_ANON_KEY) {
        return new Response(JSON.stringify({ error: 'SUPABASE_ANON_KEY is missing in function secrets' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
        global: {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        },
      });

      const { data: requestResult, error: requestError } = await userClient.rpc('request_account_deletion');

      if (requestError) {
        return new Response(JSON.stringify({ error: requestError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        mode: 'user',
        message: 'Account deletion requested successfully.',
        target: { user_id: resolvedUserId, email: targetEmail },
        reason,
        result: requestResult,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await adminClient.rpc('process_account_purge', {
      p_user_id: resolvedUserId,
      p_limit: resolvedUserId ? 1 : limit,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      mode: isAdminInvocation ? 'admin' : 'user',
      target: resolvedUserId ? { user_id: resolvedUserId, email: targetEmail } : null,
      account_info: accountInfo,
      result: data,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
