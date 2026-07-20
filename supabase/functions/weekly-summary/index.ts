// Riepilogo settimanale: quante attività fatte (e da chi) negli
// ultimi 7 giorni, più le eventuali arretrate. Da schedulare la
// domenica sera (vedi AGGIORNAMENTO-V4.md).
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
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: doneTasks }, { data: overdue }, { data: profiles }] =
    await Promise.all([
      supabase.from("tasks").select("done_by").eq("done", true).gte("done_at", weekAgo),
      supabase.from("tasks").select("id").eq("done", false).lt("due_date", today),
      supabase.from("profiles").select("id, display_name"),
    ]);

  const total = doneTasks?.length ?? 0;
  const perPerson = (profiles ?? [])
    .map((p) => {
      const n = (doneTasks ?? []).filter((t) => t.done_by === p.id).length;
      return n > 0 ? `${p.display_name} ${n}` : null;
    })
    .filter(Boolean)
    .join(", ");

  const late = overdue?.length ?? 0;
  const body =
    `Fatte ${total}${perPerson ? ` (${perPerson})` : ""}` +
    (late > 0 ? ` · ${late} in arretrato` : " · nessun arretrato 🎉");

  for (const p of profiles ?? []) {
    await sendToProfile(p.id, { title: "📊 La vostra settimana", body });
  }

  return new Response("ok");
});
