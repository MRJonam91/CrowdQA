# Contributing to CrowdQA / Contribuire a CrowdQA

## 🇮🇹 Italiano

Grazie per il tuo interesse verso CrowdQA! Accogliamo volentieri segnalazioni di bug, proposte di scenari e miglioramenti al codice.

### Requisiti per i contributi
1. **Accordo CLA**: ogni Pull Request deve includere la dichiarazione di conformità al [CLA](CLA.md):
   ```markdown
   I hereby agree to the terms of the CrowdQA Contributor License Agreement (CLA).
   ```
2. **Standard di codice**:
   - TypeScript strict (`npm run typecheck`).
   - Test unitari e di integrazione passanti (`npm test`).
   - Guardia dimensionale del modulo `src/core/`: deve rimanere tassativamente sotto le **1.500 righe** di codice non vuote.
3. **SPDX Header**: ogni nuovo file `.ts` deve iniziare con:
   ```ts
   // SPDX-License-Identifier: AGPL-3.0-only
   // Copyright (C) 2026 Manoj Rollo (MRJonam91)
   ```

---

## 🇬🇧 English

Thank you for your interest in contributing to CrowdQA! We welcome bug fixes, test scenarios, heuristic evaluations, and report engine improvements.

### Contribution Requirements
1. **CLA Agreement**: every Pull Request must accept the [Contributor License Agreement](CLA.md) by pasting in the PR description:
   ```markdown
   I hereby agree to the terms of the CrowdQA Contributor License Agreement (CLA).
   ```
2. **Quality & Test Standards**:
   - TypeScript strict mode compliance (`npm run typecheck`).
   - Native Node.js test suite passing (`npm test`).
   - Modular footprint: `src/core/` must strictly remain under **1,500 non-empty LOC** to safeguard maintainability.
3. **SPDX Header**: all newly contributed `.ts` source files must declare:
   ```ts
   // SPDX-License-Identifier: AGPL-3.0-only
   // Copyright (C) 2026 Manoj Rollo (MRJonam91)
   ```
