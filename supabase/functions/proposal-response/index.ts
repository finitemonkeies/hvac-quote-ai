import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ResponsePayload = {
  token: string;
  decision: "accepted" | "lost";
  note?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: "Missing Supabase admin configuration." }, 500);
    }

    const { token, decision, note } = (await request.json()) as ResponsePayload;

    if (!token || (decision !== "accepted" && decision !== "lost")) {
      return jsonResponse({ error: "Invalid proposal response payload." }, 400);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });

    const { data: tokenRow, error: tokenError } = await adminClient
      .from("proposal_response_tokens")
      .select("id, estimate_id, responded_at")
      .eq("token", token)
      .maybeSingle();

    if (tokenError) {
      return jsonResponse({ error: tokenError.message || "Unable to verify proposal response link." }, 500);
    }

    if (!tokenRow) {
      return jsonResponse({ error: "Proposal response link is invalid." }, 404);
    }

    if (tokenRow.responded_at) {
      return jsonResponse({ success: true, status: "already-recorded" });
    }

    const { error: estimateError } = await adminClient
      .from("estimates")
      .update({
        outcome_status: decision,
        outcome_note: note?.trim() || (decision === "accepted" ? "Customer accepted from email link." : "Customer declined from email link."),
      })
      .eq("id", tokenRow.estimate_id);

    if (estimateError) {
      return jsonResponse({ error: estimateError.message || "Failed to update proposal outcome." }, 500);
    }

    const { error: responseError } = await adminClient
      .from("proposal_response_tokens")
      .update({
        responded_at: new Date().toISOString(),
        response_status: decision,
        response_note: note?.trim() || null,
      })
      .eq("id", tokenRow.id);

    if (responseError) {
      return jsonResponse({ error: responseError.message || "Failed to record proposal response." }, 500);
    }

    return jsonResponse({ success: true, status: decision });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Failed to record proposal response." },
      400,
    );
  }
});
