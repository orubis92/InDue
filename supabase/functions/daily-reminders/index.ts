// Promemoria delle attività in scadenza, con orario personalizzato.
// Da schedulare OGNI ORA (cron: 0 * * * *): a ogni giro notifica solo
// le persone il cui reminder_hour (ora italiana) coincide con l'ora
// corrente. L'orario si imposta in Table Editor -> profiles.
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

/** Ora corrente in Italia (0-23), qualunque sia il fuso del server. */
function romeHour(): number {
  return Number(
    new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
}

Deno.serve(async () => {
  const hour = romeHour();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("reminder_hour", hour);
  if (!profiles || profiles.length === 0) {
    return new Response(`nessun promemoria alle ${hour}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("title, assigned_to")
    .eq("done", false)
    .lte("due_date", today);
  if (!tasks || tasks.length === 0) return new Response("niente in scadenza");

  for (const profile of profiles) {
    const titles = tasks
      .filter((t) => !t.assigned_to || t.assigned_to === profile.id)
      .map((t) => t.title);
    if (titles.length === 0) continue;
    const shown = titles.slice(0, 3).join(" · ");
    const extra = titles.length > 3 ? ` e altre ${titles.length - 3}` : "";
    await sendToProfile(profile.id, {
      title: `📅 In scadenza oggi (${titles.length})`,
      body: shown + extra,
    });
  }

  return new Response("ok");
});
