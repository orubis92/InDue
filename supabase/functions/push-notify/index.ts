// Notifica push quando un'attività viene assegnata a una persona.
// Viene chiamata da un Database Webhook su INSERT/UPDATE di "tasks"
// (vedi AGGIORNAMENTO-V2.md, passo 4).
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:esempio@esempio.it",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

export async function sendToProfile(profileId: string, payload: unknown) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("profile_id", profileId);

  for (const row of subs ?? []) {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify(payload));
    } catch (err) {
      // 404/410 = iscrizione scaduta o revocata: la eliminiamo
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", row.id);
      }
    }
  }
}

Deno.serve(async (req) => {
  const { type, record, old_record } = await req.json();

  // Notifica solo quando compare una NUOVA assegnazione a una persona
  const assigned = record?.assigned_to;
  const isNewAssignment =
    assigned &&
    !record.done &&
    (type === "INSERT" ||
      (type === "UPDATE" && old_record?.assigned_to !== assigned));

  // Non notificare chi si auto-assegna un'attività
  if (!isNewAssignment || assigned === record.created_by) {
    return new Response("skip");
  }

  await sendToProfile(assigned, {
    title: "Nuova attività per te",
    body: record.title,
  });

  return new Response("ok");
});
