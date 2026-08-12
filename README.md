# MantyCat

Die echte, mit Supabase verbundene Version von MantyCat.

## Vor dem ersten Start

1. In Supabase (Dashboard eures MantyCat-Projekts) unter **SQL Editor** die Datei
   `mantycat_schema.sql` ausführen (falls noch nicht geschehen), danach zusätzlich
   `mantycat_schema_fix.sql` ausführen.
2. Unter **Authentication → Providers → Email** könnt ihr zum schnelleren Testen
   die Option "Confirm email" ausschalten, dann müsst ihr euch nach der Registrierung
   nicht extra per E-Mail bestätigen. Für den echten Betrieb später wieder einschalten.
3. In `src/App.jsx` ganz oben bei `ADMIN_EMAILS` eure eigene E-Mail-Adresse eintragen,
   mit der ihr euch als Betreiber:in registrieren wollt. Nur mit dieser Adresse seht
   ihr später das Meldungen-Panel für 1-Stern-Bewertungen.

## Lokal testen

Ihr braucht dafür Node.js (falls nicht vorhanden: nodejs.org, die "LTS"-Version
herunterladen und installieren). Danach in diesem Ordner im Terminal:

```
npm install
npm run dev
```

Das öffnet die Seite lokal auf eurem Rechner (meist http://localhost:5173).

## Live schalten (Vercel, kostenlos)

1. Auf [vercel.com](https://vercel.com) mit GitHub, GitLab oder E-Mail anmelden.
2. Diesen Ordner als Projekt hochladen (entweder per GitHub-Repo verbinden, oder
   über "Deploy" den Ordner direkt hochladen, Vercel erkennt Vite-Projekte automatisch).
3. Fertig, ihr bekommt eine echte, dauerhafte Adresse wie `mantycat.vercel.app`.
4. Optional später unter Vercel → Project Settings → Domains eine eigene Domain
   wie `mantycat.at` verbinden.

## Was noch fehlt, bevor ihr wirklich live geht

- Ein Impressum und eine Datenschutzerklärung (siehe unser früheres Gespräch dazu)
- Eine Vereinbarung/AGB, wer bei Streitfällen zwischen Tauschpartner:innen haftet
- Die "Confirm email"-Option in Supabase wieder einschalten, damit sich niemand
  mit einer fremden E-Mail-Adresse registrieren kann
