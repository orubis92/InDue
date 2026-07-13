# InDue — Attività condivise in due

Una PWA per gestire le cose da fare insieme — casa, spesa, vacanza — con sincronizzazione in tempo reale tra tutti i vostri dispositivi.

**Stack:** React + Vite (frontend) · Supabase (database, login, realtime) · vite-plugin-pwa (installazione su telefono e cache offline).

---

## Come funziona

Tutti i dispositivi parlano con lo stesso database Supabase. Quando uno di voi aggiunge, completa o elimina un'attività, Supabase Realtime avvisa istantaneamente gli altri dispositivi connessi, che aggiornano la lista da soli. Non c'è nessun server da gestire: il piano gratuito di Supabase è più che sufficiente per due persone.

---

## Passo 1 — Crea il progetto Supabase (≈10 minuti)

1. Vai su [supabase.com](https://supabase.com), crea un account e un nuovo progetto (regione: `eu-central` va benissimo dall'Italia). Salva la password del database che ti chiede, anche se non ti servirà per l'app.
2. Quando il progetto è pronto, apri **SQL Editor** dal menu laterale, incolla tutto il contenuto di `supabase/schema.sql` e premi **Run**. Questo crea le tabelle (profili, categorie, attività), le regole di sicurezza e attiva il realtime.

## Passo 2 — Crea i vostri due account

1. Nel pannello Supabase vai su **Authentication → Users → Add user → Create new user**.
2. Crea un utente per te e uno per tua moglie (email + password). Spunta **Auto Confirm User** per entrambi.
3. I profili vengono creati automaticamente. Per sistemare i nomi visualizzati, apri **Table Editor → profiles** e modifica la colonna `display_name` (es. "Marco" e "Laura"). Puoi anche cambiare la colonna `color` per dare a ciascuno il proprio colore (es. `#0F6B66` e `#E8A63C`).

## Passo 3 — Chiudi le registrazioni (importante!)

L'app è pensata per voi due soltanto: le regole di sicurezza permettono a *qualunque utente autenticato* di leggere e scrivere. Perciò va impedito che estranei si registrino:

- Vai su **Authentication → Sign In / Up** e disattiva **Allow new users to sign up**.

Fatto: solo i vostri due account possono entrare.

## Passo 4 — Configura e avvia in locale

Prerequisito: [Node.js](https://nodejs.org) 18 o superiore.

```bash
# 1. Copia il file di esempio e inserisci le tue chiavi
cp .env.example .env
# Apri .env e incolla URL e anon key del progetto
# (le trovi su Supabase: Project Settings → API)

# 2. Installa le dipendenze e avvia
npm install
npm run dev
```

Apri `http://localhost:5173`, accedi con uno dei due account e prova ad aggiungere un'attività. Per vedere la magia del realtime, apri la stessa pagina in una seconda finestra con l'altro account: le modifiche appaiono da entrambe le parti in tempo reale.

## Passo 5 — Metti l'app online

Il modo più semplice è [Vercel](https://vercel.com) o [Netlify](https://netlify.com), entrambi gratuiti:

1. Carica il progetto su un repository GitHub (privato va benissimo).
2. Su Vercel: **New Project → importa il repository**. Rileva Vite da solo.
3. Nelle impostazioni del progetto aggiungi le due variabili d'ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (gli stessi valori del tuo `.env`).
4. Deploy. Otterrai un indirizzo tipo `indue.vercel.app`.

> L'anon key è pensata per essere pubblica: la sicurezza dei dati è garantita dalle regole RLS nel database e dal fatto che le registrazioni sono chiuse.

## Passo 6 — Installa l'app sui telefoni

Apri l'indirizzo dell'app dal browser del telefono:

- **iPhone (Safari):** Condividi → **Aggiungi a schermata Home**.
- **Android (Chrome):** ti proporrà da solo **Installa app**, oppure menu ⋮ → **Aggiungi a schermata Home**.

Da quel momento InDue si apre come una vera app, a tutto schermo e con la sua icona.

---

## Struttura del progetto

```
indue/
├── supabase/schema.sql        ← schema del database (da eseguire una volta)
├── index.html                 ← pagina base, font, meta PWA
├── vite.config.js             ← configurazione Vite + manifest PWA
├── .env.example               ← modello per le chiavi Supabase
└── src/
    ├── main.jsx               ← entry point React
    ├── styles.css             ← design tokens e stili
    ├── App.jsx                ← sessione, filtri, composizione
    ├── lib/supabase.js        ← client Supabase condiviso
    ├── hooks/useTasks.js      ← dati + sincronizzazione realtime
    └── components/
        ├── Auth.jsx           ← schermata di accesso
        ├── AddTaskForm.jsx    ← aggiunta rapida attività
        ├── FilterBar.jsx      ← filtri per categoria e persona
        ├── TaskList.jsx       ← liste "Da fare" / "Fatte"
        └── TaskItem.jsx       ← singola attività
```

Le categorie di partenza (Casa 🏠, Spesa 🛒, Vacanza 🏖️, Varie 📌) si modificano direttamente dal **Table Editor** di Supabase, tabella `categories`: nome, emoji, colore e ordine.

---

## Prossimi passi (roadmap)

Quando la base vi è comoda, questi sono gli sviluppi naturali, in ordine di sforzo crescente:

1. **Ordinamento e modifica attività** — oggi si possono creare, completare ed eliminare; aggiungere la modifica del titolo/scadenza è un buon primo esercizio.
2. **Notifiche push** — con Firebase Cloud Messaging o le Web Push API: notifica quando l'altro ti assegna un compito. Richiede una Supabase Edge Function che invia la push quando viene inserita una riga con `assigned_to`.
3. **Promemoria a scadenza** — una Edge Function schedulata (cron) che ogni mattina controlla le attività in scadenza e invia le notifiche.
4. **Offline completo** — la PWA già memorizza l'interfaccia; per lavorare offline sui *dati* (es. in vacanza senza campo) serve una cache locale con coda di sincronizzazione (IndexedDB), lo sviluppo più impegnativo della lista.

Buon lavoro — e buone liste! ✓✓
