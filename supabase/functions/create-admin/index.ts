
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email: "admin@ipjuon.com",
    password: "Admin1234!",
    email_confirm: true,
    user_metadata: { name: "슈퍼관리자" },
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { status: 200 });
});
