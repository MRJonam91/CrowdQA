# Piano di Sviluppo & Roadmap / Development Plan & Roadmap — CrowdQA

## 🎯 Visione di Progetto / Project Vision

**CrowdQA** nasce per risolvere un problema critico vissuto da piccoli team di sviluppo, indie hacker e startup: ottenere **test umani strutturati, riproducibili e privi di rischi di riservatezza**, colmando il divario tra i test automatici sintetici (Playwright, Cypress) e i costosi portali enterprise di crowd testing.

---

## 🗺️ Fasi di Sviluppo / Development Phases

### ✅ Fase 1 — Motore Core Standalone a Zero Dipendenze (v1.0.0 — General Availability)
*Completata con successo in data 2026-11-06.*

- [x] **Orchestrazione Campagne**: Schema dichiarativo per definire target URL, matrici di dispositivi (Desktop 1080p, Mobile Safari 390px, Mobile Android 360px), profili utente/demografiche e Quality Gates.
- [x] **Consenso Informato & NDA Crittografico**: Generazione e firma di accordi legali di riservatezza tramite hash SHA-256 a prova di manomissione.
- [x] **Bonifica Automatica Dati Sensibili (Zero-Leak PII Scrub)**: Regex engine nativo per oscurare Bearer token, JWT, API key (`sk-...`, `ghp_...`), password nei parametri, carte di credito e indirizzi email.
- [x] **Clustering Euristico**: Raggruppamento automatico di anomalie simili segnalate da tester diversi su piattaforme differenti con escalation alla gravità massima.
- [x] **Sintesi Multi-Formato**:
  - Report esecutivo e tecnico in **Markdown** per PR e issue tracker.
  - Export strutturato in **JSON** per automazioni.
  - Dashboard **HTML interattiva e responsive** autonoma con ricerca istantanea live, filtri per gravità e zero CDN esterni.
- [x] **Interoperabilità CI/CD Standard**:
  - Esportatore conforme ad **OASIS SARIF 2.1.0** per il tab GitHub Security / Code Scanning.
  - Esportatore **JUnit XML** per l'integrazione nativa nei tab di esecuzione test di GitHub Actions, GitLab CI, Jenkins e Azure DevOps.
  - Esportatore **CSV** e schede issue GitHub.
- [x] **Benchmark CrowdScore™ & DDI**: Calcolo di un punteggio comparativo 0–100 con attribuzione di lettere (da **A+** a **F**), Defect Density Index e concordanza inter-tester.
- [x] **Strumenti di Diagnostica & Badge**: Comandi `crowdqa doctor` e `crowdqa badge` per generare badge SVG dinamici di qualità.
- [x] **Suite di Test Completa**: 40 unit e integration test con copertura al 100% e guardia dimensionale del core (< 1.500 LOC).

---

### 🚀 Fase 2 — Ecosistema di Integrazione & Flussi Collaborativi (v1.1 - v1.3 — Q1/Q2 2027)

- [ ] **Sincronizzazione Bidirezionale Issue Tracker**:
  - Connettori diretti per aprire automaticamente issue su GitHub, Jira e Linear per ogni cluster di difetti confermato.
  - Aggiornamento automatico dello stato del difetto alla chiusura della PR.
- [ ] **Parser di Registrazioni e Replay DOM**:
  - Supporto per file di registrazione rrweb con scrub automatico dei campi di input prima del salvataggio.
- [ ] **Notifiche & Webhook Real-Time**:
  - Notifiche push su Slack, Discord e Telegram nel momento esatto in cui un tester segnala un difetto *Blocker (P0)*.
- [ ] **Gestione Coorti e Quote Demografiche**:
  - Ripartizione automatica degli inviti a gruppi di tester in base a lingua, dispositivo e livello di esperienza tecnica.

---

### 🌐 Fase 3 — Marketplace Distribuito e Rete Tester Verificati (v2.0 — Visione Futura)

- [ ] **Pool di Tester Certificati**:
  - Sistema di reputazione verificata per tester umani indipendenti basato su accuratezza storica, assenza di falsi positivi e tempestività.
- [ ] **Modello Bounty & Escrow**:
  - Gestione sicura di compensi e bounty per bug confermati e non duplicati tramite smart contract o gateway di pagamento conformi.
- [ ] **SDK Multi-Linguaggio**:
  - Librerie client in Python, Go e estensione browser per semplificare l'invio delle segnalazioni da parte dei tester durante le sessioni di navigazione guidata.

---

## 📊 Metodologia di Rilascio

Il progetto segue rigorosamente il **Semantic Versioning 2.0.0**:
- **Patch (1.0.x)**: Correzioni di bug, aggiornamenti di documentazione e miglioramenti di compatibilità.
- **Minor (1.x.0)**: Nuove funzionalità retrocompatibili, esportatori aggiuntivi e integrazioni.
- **Major (2.x.0)**: Modifiche architetturali rilevanti o evoluzione verso il modello marketplace federato.
