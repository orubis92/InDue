# InDue — Aggiornamento alla versione 4

## Cosa aggiunge

- **🛒 Modalità spesa** — vista dedicata dal carrello in alto: scrivi e premi invio, il campo resta pronto per la voce successiva; le voci si raggruppano da sole per reparto del supermercato (frutta e verdura, latticini, dispensa…); tocchi una voce per metterla "nel carrello" e a fine spesa "Svuota" elimina il comprato.
- **📅 Calendario delle scadenze** — vista mensile con le attività in scadenza *e* i richiami del libretto sanitario degli animali (pallini marroni). Tocca un giorno per il dettaglio, spunta le attività direttamente da lì. I giorni con arretrati sono segnati in rosso.
- **Condivisione da altre app** — dal telefono: "Condividi → InDue" su un link o un testo lo trasforma in una nuova attività precompilata (il link finisce nelle note).
- **Badge sull'icona** — il numero delle attività da fare compare sull'icona dell'app, come le mail non lette (dove il sistema lo supporta).
- **📷 Foto allegate** — su attività (scontrini, prodotti) e sul libretto sanitario degli animali (pagina del libretto vaccinale, referti). Miniatura sotto l'attività, tocco per l'originale.
- **📊 Riepilogo settimanale** — la domenica sera: "Fatte 14 (Laura 9, Omar 5) · 3 in arretrato".
- **⏰ Orario personale del promemoria** — ognuno riceve il promemoria mattutino all'ora che preferisce.
- **⬇️ Esportazione dati** — dal menu ⋯, un backup completo in JSON scaricabile quando vuoi.
- **Header riorganizzato** — 🛒 e 📅 sempre a portata di mano; notifiche, liste 🧳, animali 🐾, backup e uscita ora vivono nel menu ⋯.

## Passi di aggiornamento

### 1. Database e storage

Esegui `supabase/migration_v4.sql` nell'SQL Editor. Oltre alle nuove colonne, crea il **bucket "foto"** con le sue regole: caricare ed eliminare richiede il login, mentre le foto sono visibili a chiunque abbia il link (i nomi dei file sono codici casuali non indovinabili — per foto di scontrini e libretti va bene; evita di caricarci documenti sensibili).

### 2. Codice

```bash
git add . && git commit -m "InDue v4" && git push
```

Niente `npm install`: nessuna nuova dipendenza.

### 3. Promemoria a orario personale

L'orario di ciascuno si imposta in **Table Editor → profiles → colonna `reminder_hour`** (ora italiana, 0–23; default 8). Perché funzioni, il cron del promemoria deve girare **ogni ora**:

- Su Supabase: **Integrations → Cron** → modifica il job `promemoria-mattutino` → schedule: `0 * * * *`

La funzione controlla da sola l'ora italiana (gestisce anche ora legale/solare) e notifica solo chi ha scelto quell'ora.

### 4. Riepilogo settimanale

Ripubblica le funzioni (la daily-reminders è cambiata, la weekly-summary è nuova):

```bash
supabase functions deploy daily-reminders --no-verify-jwt
supabase functions deploy weekly-summary --no-verify-jwt
```

Poi crea il secondo job cron: **Integrations → Cron → Create job** → nome `riepilogo-settimanale`, schedule `0 17 * * 0` (domenica alle 17 UTC = 19 ora italiana estiva, 18 invernale), tipo Edge Function → `weekly-summary`.

### 5. Condivisione da altre app (nota)

La voce "InDue" nel menu di condivisione di Android compare dopo aver **reinstallato la PWA** (rimuovi l'icona dalla Home e riaggiungila), perché il "contratto" di condivisione vive nel manifest letto all'installazione. Su iPhone la condivisione verso PWA non è supportata dal sistema: lì la funzione semplicemente non compare, non è un difetto dell'app.

## Note oneste

- Le **foto** richiedono la rete: aggiungendo un'attività offline, l'eventuale foto viene ignorata (la si può aggiungere dopo con ✎).
- Il piano gratuito di Supabase include 1 GB di storage: per scontrini e libretti è tantissimo, ma se un giorno vi avvicinaste al limite, eliminare le attività non elimina le foto dal bucket (pulizia manuale da **Storage → foto** nel pannello).
- Il **badge sull'icona** funziona su Android/Chrome e su desktop; su iPhone il supporto è parziale e potrebbe non comparire.
