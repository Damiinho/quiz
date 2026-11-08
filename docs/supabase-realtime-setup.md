# Supabase Realtime setup

The game can use either Supabase Realtime or the existing public ntfy service.
The host selects one service before creating the online game code. New codes are
seven characters long: `S` at the start means Supabase and `N` means ntfy. The
player app detects the service from the code automatically. Invite links also
carry the service for compatibility with older six-character codes.

## Configure Supabase

1. Create a Supabase project.
2. In **Project Settings → API**, copy the project URL and the publishable key
   (or the legacy `anon` key).
3. Add these environment variables to the local `.env.local` file and to the
   production hosting environment:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

4. Restart the development server or redeploy the site after setting the
   variables. The Supabase option becomes available in the online connection
   selector on the host's category screen.

No database table or SQL migration is needed. This integration uses transient
Supabase Realtime Broadcast messages on a public channel named from the game
code. Players request the latest state when they connect; the host sends it
back. The game state and events are not saved in Supabase.

## Notes

- Use the Supabase publishable/anon key in the browser. Never put a `service_role`
  or secret key in a `VITE_` variable.
- Invite links carry `backend=supabase` or `backend=ntfy`; players therefore join
  the same transport chosen by the host.
- Channels are public and anyone who knows a room code could observe or publish
  messages to that room. Treat codes as private invitations and do not reuse
  them. This is similar to the existing ntfy topics, which are also public.
- Supabase's free Realtime quota is subject to the current plan limits. Monitor
  usage in the Supabase dashboard.
