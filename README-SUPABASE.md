# VIBE CUT — Supabase setup

The project is wired to Supabase through `src/lib/supabaseClient.ts` and
`src/lib/appointmentService.ts`.

## 1. Create the database

In the Supabase dashboard, open **SQL Editor**, paste the contents of:

`supabase/schema.sql`

and run it once.

## 2. Local development

The supplied `.env.local` contains the project URL and publishable key.

Do not replace the publishable key with a `service_role` or `sb_secret_` key.

## 3. Netlify

For a Netlify deployment, add these environment variables in:

**Site configuration → Environment variables**

`NEXT_PUBLIC_SUPABASE_URL`
`https://ospwppugandeunyqnfsb.supabase.co`

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
`<your sb_publishable_... key>`

Then redeploy.

## What is connected

- Appointment creation
- Appointment lookup for date/time availability
- Blocked dates
- Blocked time slots
- Salon working-hours settings
- Supabase Auth helpers already present in the project

The booking UI remains unchanged by this integration.
