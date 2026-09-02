# Abitur-Rechner

Berechnet die voraussichtliche Abiturnote am **Weiterbildungskolleg** aus den Kursnoten der
Semester 3–6 und den Abiturprüfungsnoten — inklusive Prüfung der Zulassungs- und
Bestehensbedingungen.

**Live:** https://sebboms.github.io/abi-rechner/

> **Die Ergebnisse sind nicht verbindlich.** Der Rechner ersetzt keine Beratung durch
> Semesterleitung oder Oberstufenkoordination.

---

## Wichtig für andere Schulen

Die **Fächerbelegung ist fest auf das WBK Münster zugeschnitten** und steht so im Code:

| Bereich | Belegung |
|---|---|
| Leistungskurse | Biologie, Deutsch (je S3–S6) |
| Pflicht-Grundkurse | Mathematik, Englisch, Geschichte (je S3–S6) |
| Optionale Grundkurse | Kunst (S3, S4), Erdkunde (S5, S6) |
| 3./4. Abiturfach | Mathematik **oder** Englisch (Auswahl per Checkbox) |

Wer den Rechner an einer anderen Schule einsetzen will, muss diese Belegung anpassen — die
Rechenregeln darunter folgen der APO-WbK und gelten allgemein.

## Rechenregeln

**Block I** — Leistungskurse zählen doppelt:

```
Block I = round( (2 · ΣLK + ΣGK) / (2 · Anzahl LK-Kurse + Anzahl GK-Kurse) · 40 )
```

Die **optionalen Grundkurse** werden nur eingebracht, wenn ihre Note über dem bis dahin
erreichten Durchschnitt liegt — sie können das Ergebnis also nur verbessern. Ausnahme: Ab
fünf Defiziten werden alle Kurse eingebracht (Pflicht zur Vollbelegung).

**Block II** — die vier Abiturprüfungen, jeweils fünffach:

```
Block II = 5 · Σ Abiturnoten
```

**Durchschnittsnote:**

```
Note = max( 1,0 ;  5,67 − Gesamtpunkte / 180 )
```

**Defizit** = Kurs mit 4 Punkten oder weniger.

Der Rechner bricht mit einer Meldung ab, wenn eine dieser Bedingungen verletzt ist:

| Bedingung | Folge |
|---|---|
| Semesterkurs mit 0 Punkten | keine Zulassung |
| mehr als 5 Defizite insgesamt | keine Zulassung |
| mehr als 3 Defizite im LK-Bereich | keine Zulassung |
| Block I unter 200 Punkte | keine Zulassung |
| Block II unter 100 Punkte | nicht bestanden (mündliche Nachprüfung ggf. möglich) |
| 2 Defizite in den LK-Prüfungen | nicht bestanden (mündliche Nachprüfung ggf. möglich) |
| 2 Defizite in den GK-Prüfungen | nicht bestanden (mündliche Nachprüfung ggf. möglich) |

## Funktionen

- Fortschrittsanzeige, Notenstufe als Hinweis beim Antippen eines Feldes
- Farbige Markierung: eingebrachte Kurse, Defizite, Nullen
- **Ziel-Schnitt:** zeigt, wie viele Punkte für einen Wunschschnitt noch fehlen
- **Szenarien:** bis zu drei Notensets (z. B. optimistisch / realistisch / pessimistisch)
  speichern und vergleichen
- **Teilen:** erzeugt einen Link, der die eingegebenen Noten enthält
- Druckansicht

## Datenschutz

Es gibt **kein Backend**. Alle Eingaben bleiben im Browser (`localStorage`) und werden nirgends
übertragen. Der Teilen-Link kodiert die Noten im URL-Fragment (`#g=…`) — er wird nicht an den
Server gesendet, sollte aber nicht unbedacht weitergegeben werden, da er die Noten enthält.

## Aufbau & Anpassen

Drei statische Dateien, kein Build-Schritt, keine Abhängigkeiten:

| Datei | Inhalt |
|---|---|
| `index.html` | Fächertabelle — hier stehen die Fächer und Eingabefelder |
| `script.js` | Berechnung, Validierung, Szenarien, Teilen-Link |
| `styles.css` | Design, Hell-/Dunkelmodus, Druckansicht |

Zum Ausprobieren genügt es, `index.html` im Browser zu öffnen.

Beim Anpassen an eine andere Fächerbelegung sind das die Stellen in `script.js`:

| Konstante | Bedeutung |
|---|---|
| `FIELD_ORDER` | alle Felder in DOM-Reihenfolge (LK zuerst, dann GK) |
| `LK_NAMES` | Kurse, die doppelt zählen |
| `MANDATORY_GK_NAMES` | immer eingebrachte Grundkurse |
| `OPTIONAL_GK_NAMES` | Grundkurse, die nur bei Verbesserung eingebracht werden |
| `FIELD_LABELS` | Kurzbezeichnungen für die Defizit-Liste |

Die Feldnamen in `index.html` (`name="…"`) müssen zu diesen Konstanten passen, und die
Reihenfolge der `*Exam`-Felder im HTML muss `FIELD_ORDER` entsprechen — `collectAbiturGrades()`
verlässt sich auf die DOM-Reihenfolge.

## Veröffentlichen

Die Seite läuft über GitHub Pages aus dem `main`-Branch (Wurzelverzeichnis). Ein Push nach
`main` ist damit sofort live.

## Lizenz

[MIT](LICENSE) — Nutzung, Anpassung und Weitergabe sind ausdrücklich erwünscht, auch für
andere Schulen. Über eine kurze Rückmeldung freue ich mich: aufdemkamps@wbk.ms.de
