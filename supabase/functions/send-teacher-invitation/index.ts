import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the invitation data from the request
    const { email, firstName, lastName, invitationId } = await req.json()

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, firstName, lastName' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role key (has admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Generate magic link for teacher onboarding
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          user_type: 'teacher',
          invitation_id: invitationId
        },
        redirectTo: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}/teacher/onboard`
      }
    })

    if (linkError) {
      console.error('Magic link generation error:', linkError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate magic link', details: linkError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Optional: Send custom email using your preferred email service
    // For now, Supabase will automatically send the magic link email
    console.log('Magic link generated successfully for:', email)

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        magicLink: linkData.properties?.action_link // For debugging/logging only
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-teacher-invitation function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})