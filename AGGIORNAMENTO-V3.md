# InDue — Aggiornamento alla versione 3: Animali 🐾

## Cosa aggiunge

Una sezione dedicata ai vostri animali, raggiungibile dalla zampetta 🐾 in alto:

- **Scheda per ogni animale** — nome, specie/razza, età calcolata dalla data di nascita, e un campo note per tutto ciò che va ricordato: cibo abituale e dosi, allergie, numero di microchip, veterinario di fiducia e telefono.
- **Libretto sanitario** — registra visite veterinarie, vaccini, antiparassitari, toelettature e pesate, con data e note.
- **Prossime scadenze** — ogni voce del libretto può avere una scadenza futura (es. il richiamo del vaccino tra un anno): compare in cima alla scheda e col pulsante "→ Attività" diventa un'attività con quella data, entrando così nel giro dei promemoria mattutini.
- **Categoria "Animali" 🐾** tra le attività — per le faccende ricorrenti quotidiane (comprare il cibo, pulire la lettiera, antiparassitario mensile) usa le normali attività ricorrenti con questa categoria.

## Come si aggiorna

1. **Database:** esegui `supabase/migration_v3.sql` nell'SQL Editor (una volta sola). Crea le tabelle `pets` e `pet_events` e la categoria Animali.
2. **Codice:** `git add . && git commit -m "InDue v3 animali" && git push` — Vercel ripubblica da solo. Nessuna nuova dipendenza: `npm install` non serve.

## Come conviene usarla

- Metti nelle **note dell'animale** le informazioni stabili (cibo, microchip, contatti del veterinario): sono sempre a portata di mano, anche dal telefono in sala d'attesa.
- Usa il **libretto** per lo storico: dopo ogni visita o vaccino, registralo subito con l'eventuale richiamo come "prossima scadenza", e trasformala in attività così nessuno dei due se la dimentica.
- Usa le **attività ricorrenti** (categoria Animali) per la routine: es. "Antiparassitario a Luna" ogni 30 giorni.
