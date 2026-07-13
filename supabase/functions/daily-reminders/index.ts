// Promemoria mattutino: notifica le attività in scadenza oggi (o già
// scadute e non fatte). Da schedulare con il Cron di Supabase
// (vedi AGGIORNAMENTO-V2.md, passo 5).
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

async function sendToProfile(profileId: string, payload: unknown) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("profile_id", profileId);
  for (const row of subs ?? []) {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify(payload));
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", row.id);
      }
    }
  }
}

Deno.serve(async () => {
  const today = new Date().toISOString().slice(0, 10);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("title, assigned_to")
    .eq("done", false)
    .lte("due_date", today);

  if (!tasks || tasks.length === 0) return new Response("niente in scadenza");

  const { data: profiles } = await supabase.from("profiles").select("id");
  const allIds = (profiles ?? []).map((p) => p.id);

  // Raggruppa per persona; le attività "di entrambi" vanno a tutti e due
  const byPerson = new Map<string, string[]>();
  for (const t of tasks) {
    const targets = t.assigned_to ? [t.assigned_to] : allIds;
    for (const id of targets) {
      byPerson.set(id, [...(byPerson.get(id) ?? []), t.title]);
    }
  }

  for (const [profileId, titles] of byPerson) {
    const shown = titles.slice(0, 3).join(" · ");
    const extra = titles.length > 3 ? ` e altre ${titles.length - 3}` : "";
    await sendToProfile(profileId, {
      title: `📅 In scadenza oggi (${titles.length})`,
      body: shown + extra,
    });
  }

  return new Response("ok");
});
