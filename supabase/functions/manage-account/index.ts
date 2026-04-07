import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, ...payload } = await req.json();

    if (action === "create") {
      const { email, password, name, phone, role } = payload;

      // Create auth user
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (createError) {
        const msg = createError.message.includes("already been registered")
          ? "이미 사용 중인 이메일입니다."
          : createError.message;
        return new Response(JSON.stringify({ error: msg }), { status: 400, headers: corsHeaders });
      }

      const userId = userData.user.id;

      // Update profile phone if provided
      if (phone) {
        await supabase.from("profiles").update({ phone }).eq("user_id", userId);
      }

      // Assign role
      if (role) {
        await supabase.from("user_roles").insert({ user_id: userId, role });
      }

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        status: 200, headers: corsHeaders,
      });
    }

    if (action === "update") {
      const { user_id, name, phone, role, password } = payload;

      // Update profile
      const updates: Record<string, string> = {};
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("user_id", user_id);
      }

      // Update password if provided
      if (password) {
        const { error: pwError } = await supabase.auth.admin.updateUserById(user_id, { password });
        if (pwError) {
          return new Response(JSON.stringify({ error: pwError.message }), { status: 400, headers: corsHeaders });
        }
      }

      // Update role
      if (role) {
        await supabase.from("user_roles").delete().eq("user_id", user_id);
        await supabase.from("user_roles").insert({ user_id, role });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    if (action === "delete") {
      const { user_id } = payload;

      // Delete role, profile, then auth user
      await supabase.from("user_roles").delete().eq("user_id", user_id);
      await supabase.from("profiles").delete().eq("user_id", user_id);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
