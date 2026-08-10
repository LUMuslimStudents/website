import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const LU_EMAIL_REGEX = /^[a-zA-Z0-9.-]{5,}@student\.lu\.se$/;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
      },
    });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required', isValid: false }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isValid = LU_EMAIL_REGEX.test(normalizedEmail);

    return new Response(
      JSON.stringify({
        isValid,
        email: normalizedEmail,
        message: isValid
          ? 'Valid LU student email'
          : 'Not an LU student email (must be @student.lu.se)',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        isValid: false,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
        },
      }
    );
  }
});
