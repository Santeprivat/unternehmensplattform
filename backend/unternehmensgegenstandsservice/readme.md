# Unternehmensgegenstandsservice

## Überblick

Der **Unternehmensgegenstandsservice** ist ein externer, fachlicher Entscheidungsservice zur Ermittlung eines konsistenten Unternehmensgegenstands im Rahmen einer Unternehmensgründung.

Er unterstützt einen **dialogbasierten Klärungsprozess**, bei dem aus einer **unscharfen Gründungsabsicht (Freitext)** schrittweise:

- geeignete wirtschaftliche Tätigkeiten (z. B. WZ-Schlüssel),
- zulässige Unternehmensbezeichnungen und
- daraus abgeleitete Genehmigungs- oder Anzeigeerfordernisse

ermittelt werden.

Der Service ist **zustandslos**, **speichert keine Daten** und trifft **keine prozessualen Entscheidungen**.

---

## Abgrenzung

### Der Service ist verantwortlich für
- fachliche Interpretation von Freitext-Intents
- Vorschläge für Tätigkeiten (z. B. WZ-Schlüssel)
- fachliche Namensbewertung im Tätigkeitskontext
- Ableitung von Genehmigungserfordernissen
- Identifikation von Klärungsbedarfen
- Konsolidierung zu einem fachlich schlüssigen Vorschlag

### Der Service ist **nicht** verantwortlich für
- Persistenz oder Vorgangsverwaltung
- Statuswechsel oder Prozesssteuerung
- Benutzer- oder Rollenlogik
- UI- oder Chat-Logik
- Register- oder Echtzeitabfragen
- rechtlich verbindliche Entscheidungen

---

## Fachliches Grundprinzip

Der Service arbeitet nach dem Muster:

> **Absicht → fachliche Interpretation → Klärungsbedarf → konsistenter Vorschlag**

Der Dialog entsteht **nicht** durch gespeicherten Zustand im Service, sondern durch **wiederholte Aufrufe mit angereicherten Fakten**.

---

## Zentrale fachliche Begriffe

### Intent (Absicht)
Unstrukturierte Beschreibung dessen, was der Gründer vorhat.  
Ein Intent ist **keine geprüfte Tatsache** und kann mehrdeutig oder unvollständig sein.

### Context (Rahmenbedingungen)
Normativer Rahmen für die Bewertung, z. B.:
- Rechtsordnung (z. B. DE)
- Rechtsform (z. B. GmbH)

### ActivitySuggestion (Tätigkeitsvorschlag)
Fachliche Interpretation des Intents als wirtschaftliche Tätigkeit (z. B. WZ-Schlüssel) inklusive Begründung und Vertrauensgrad.

### Clarification (Klärungsbedarf)
Fachliche Unschärfe oder Mehrdeutigkeit, die eine Entscheidung verhindert und durch den Antragsteller aufzulösen ist.

### ResolvedFact (geklärte Tatsache)
Vom Antragsteller bestätigte oder präzisierte Angabe, die einen Intent konkretisiert.

### CompanyNameAssessment (Namensbewertung)
Fachliche Bewertung einer Unternehmensbezeichnung im Kontext der Tätigkeiten (z. B. Irreführungsrisiken).

### ApprovalRequirement (Genehmigungserfordernis)
Abgeleitete Pflicht zur Genehmigung oder Anzeige aufgrund der Tätigkeiten.

### Proposal (Vorschlag)
Konsistenter, fachlich geprüfter Vorschlag bestehend aus:
- bestätigten Tätigkeiten
- konsistenter Unternehmensbezeichnung
- abgeleiteten Genehmigungen

---

## Fachliche Invarianten

- Ohne geklärte Klärungsbedarfe wird **kein Proposal** erzeugt
- Ein Proposal ist **vollständig oder existiert nicht**
- Intents werden **nicht gespeichert**
- Genehmigungen werden **abgeleitet**, nicht gewählt
- Das Frontend kennt **keine WZ-Schlüssel**

---

## Rolle im Gesamtsystem

### Interaktion

- **Frontend**
  - führt den Chat/Dialog
  - sammelt Antworten
  - orchestriert Aufrufe

- **Unternehmensgegenstandsservice**
  - bewertet Fakten
  - erkennt Unschärfen
  - erstellt Vorschläge

- **Vorgangsservice**
  - speichert das finale Proposal als Tatsache
  - enthält keine Fachlogik

Der Service wird **nicht** vom Vorgangsservice aufgerufen.

---

## Technische Leitplanken

- eigener Service
- eigene OpenAPI-Spezifikation
- stateless
- synchron
- API-first
- regelbasiert (KI optional unterstützend, nicht entscheidend)

---

## Zielsetzung

Der Unternehmensgegenstandsservice schafft eine **fachlich saubere, erklärbare und föderationsfähige Grundlage** für die Unternehmensgründung und spätere Lebenslagen – ohne den Vorgangsservice fachlich aufzuladen.

---

### WZ-Klassifikation

Der Unternehmensgegenstandsservice benötigt Zugriff auf die
WZ-Klassifikationsdatenbank.

Setze dazu die Environment-Variable:

WZ_DB_PATH=.../classification/dist/wz.db

## Status

- Domänenmodell definiert
- API-Spezifikation in Vorbereitung (v0.1)
- Regelmodell MVP folgt
