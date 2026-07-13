# InDue — Aggiornamento alla versione 2

Cosa c'è di nuovo:

- **Campo note** su ogni attività (marca preferita, indirizzi, misure…)
- **Modifica delle attività** — tocca ✎ per cambiare titolo, note, categoria, persona, scadenza, ricorrenza
- **Attività ricorrenti** — "ogni martedì l'umido": completandola, la prossima nasce da sola
- **Chi ha fatto cosa** — le attività fatte mostrano chi le ha completate e quando
- **Pulizia automatica** — le fatte spariscono dopo 7 giorni; il pulsante "Svuota" le elimina tutte
- **Liste riutilizzabili** 🧳 — la lista "valigia" la scrivi una volta e la riusi a ogni partenza
- **Notifiche push** 🔔 — avviso sul telefono quando l'altro ti assegna un compito
- **Promemoria giornaliero** — ogni mattina, notifica con le attività in scadenza
- **Tema scuro** — automatico in base alle impostazioni del dispositivo
- **Offline** — l'app si apre e si usa anche senza rete; le modifiche si sincronizzano al ritorno della connessione

I passi 1 e 2 bastano per avere tutto **tranne le notifiche**. I passi 3–6 servono solo per notifiche push e promemoria (sono i più laboriosi: prenditi mezz'ora con calma).

---

## Passo 1 — Aggiorna il database

Nel pannello Supabase apri **SQL Editor**, incolla il contenuto di `supabase/migration_v2.sql` e premi **Run**. Aggiunge le colonne per ricorrenze e "chi ha fatto cosa" e le tabelle per liste riutilizzabili e notifiche. I dati esistenti non vengono toccati.

## Passo 2 — Aggiorna il codice e ripubblica

```bash
npm install        # installa le nuove dipendenze (workbox)
npm run dev        # prova in locale
```

Poi carica su GitHub come al solito:

```bash
git add .
git commit -m "InDue v2"
git push
```

Vercel ripubblica da solo. **Fin qui hai già tutto tranne le notifiche** — se ti bastano note, modifica, ricorrenze, liste e tema scuro, puoi fermarti.

---

## Notifiche push e promemoria (passi 3–6)

Come funzionano: ogni dispositivo che tocca la campanella 🔔 si "iscrive" alle notifiche. Quando qualcuno assegna un'attività, un piccolo programma che gira su Supabase (una *Edge Function*) invia la notifica ai dispositivi della persona interessata. Serve una coppia di chiavi (VAPID) che identifica la tua app presso i servizi push dei browser.

### Passo 3 — Genera le chiavi VAPID

Dal terminale, in qualunque cartella:

```bash
npx web-push generate-vapid-keys
```

Ottieni una **Public Key** e una **Private Key**. Conservale entrambe. Poi:

- Aggiungi la pubblica al file `.env` locale: `VITE_VAPID_PUBLIC_KEY=BN...`
- Aggiungila anche su Vercel tra le variabili d'ambiente (Settings → Environment Variables), e rifai il deploy.

### Passo 4 — Pubblica le Edge Functions

Serve la CLI di Supabase (una tantum):

```bash
npm install -g supabase
supabase login
```

Poi, dalla cartella del progetto:

```bash
# Collega la cartella al tuo progetto (il "ref" è nell'URL del pannello:
# https://supabase.com/dashboard/project/QUESTO-CODICE)
supabase link --project-ref IL-TUO-REF

# Salva le chiavi come segreti delle funzioni
supabase secrets set VAPID_PUBLIC_KEY="BN..." VAPID_PRIVATE_KEY="..." VAPID_SUBJECT="mailto:tua@email.it"

# Pubblica le due funzioni
supabase functions deploy push-notify --no-verify-jwt
supabase functions deploy daily-reminders --no-verify-jwt
```

### Passo 5 — Collega la funzione alle attività (webhook)

Nel pannello Supabase: **Database → Webhooks → Create a new hook**:

- **Name:** `notifica-assegnazione`
- **Table:** `tasks`
- **Events:** spunta `Insert` e `Update`
- **Type:** `Supabase Edge Functions` → seleziona `push-notify`

Da questo momento, ogni volta che un'attività viene creata o modificata, la funzione decide se c'è da notificare qualcuno (solo quando compare una nuova assegnazione, e mai a chi si auto-assegna).

### Passo 6 — Programma il promemoria mattutino

Nel pannello Supabase: **Integrations → Cron** (attivalo se richiesto) → **Create job**:

- **Name:** `promemoria-mattutino`
- **Schedule:** `0 6 * * *` (attenzione: l'orario è in **UTC**, quindi 6:00 UTC = 8:00 ora italiana estiva, 7:00 invernale)
- **Type:** `Supabase Edge Function` → seleziona `daily-reminders` (metodo POST)

### Attiva le notifiche sui telefoni

Apri l'app **pubblicata** (le push non funzionano con `npm run dev`; in locale puoi provarle con `npm run build && npm run preview`) e tocca la campanella 🔕 → conferma il permesso. Va fatto **su ogni dispositivo** che vuole ricevere notifiche.

> **Importante per iPhone:** le notifiche push web funzionano solo se l'app è stata **aggiunta alla schermata Home** (iOS 16.4 o successivo) e viene aperta da lì, non da Safari. Su Android funzionano anche dal browser.

---

## Come si usano le novità

- **Note:** nel form di aggiunta tocca "+ Note, scadenza, ricorrenza…"; le note compaiono in piccolo sotto il titolo.
- **Ricorrenze:** scegli "Ogni settimana" (o altro) creando l'attività. Quando la spunti, la prossima occorrenza nasce da sola con la scadenza successiva.
- **Liste riutilizzabili:** tocca 🧳 in alto → "+ Nuova lista" → una voce per riga. A ogni partenza, "Aggiungi" le trasforma in attività.
- **Offline:** in vacanza senza campo l'app si apre lo stesso con i dati dell'ultima sincronizzazione; spunte, aggiunte e modifiche vengono messe in coda e inviate appena torna la rete (una banda gialla ti avvisa quando sei offline).

## Limiti noti (onestà prima di tutto)

- L'offline sincronizza *le tue* modifiche al ritorno della rete; se nel frattempo entrambi avete modificato la **stessa** attività, vince l'ultima modifica arrivata. Con due persone è un caso raro e innocuo.
- Il promemoria giornaliero arriva all'orario del cron, uguale per tutti: non ci sono ancora orari personalizzati per persona.
