# VIBE CUT merged build

This build keeps the customer booking UI from the modified reference project and adds the working /admin and /admin/login routes on top of the Supabase-connected project.

Run `npm install` then `npm run build`.

For production Supabase admin access, create a Supabase Auth user and add its UUID to `public.admin_users`.
