# CrowdQA Audit Report: E-Commerce Checkout & Payment Flow QA

**Campaign ID:** `campaign-ecommerce-checkout`  
**Target Application:** https://demo-shop.example.com/checkout  
**Audit Status:** 🟢 **PASSED**  
**Generated At:** `2026-11-06T16:12:29.436Z`  
**Provenance SHA-256:** `3060bf690e8172c4f9f5801d31e3e3a7b8294c2d707d0101af4bdb4d213414d4`

---

## 📊 Executive Summary

| Metric | Result | Description |
|---|---|---|
| **Gate Status** | **PASSED** | All quality gates met successfully. |
| **Participating Testers** | **2** | Independent human test contributors |
| **Total Findings Ingested** | **3** | Validated submissions with PII redaction |
| **Deduplicated Defect Clusters** | **2** | Consolidated problem clusters |
| **Task Completion Rate (TCR)** | **100%** | Completed user mission steps |
| **UX Friction Index** | **25 / 100** | Weighted heuristic disruption score |

### Severity Distribution
- 🚨 **Blockers (P0):** 0
- ⚠️ **Critical (P1):** 0
- 🔸 **Major (P2):** 2
- 🔹 **Minor (P3):** 1
- 💡 **Suggestions (P4):** 0

---

## 🔍 Consolidated Defect Clusters (2)

### 1. [MAJOR] Coupon code input hangs with infinite loader on mobile viewport
- **Cluster ID:** `cluster-1` (Grouped 2 finding(s) across testers: tester-alicia, tester-marco)
- **Category:** `functional_bug`
- **Step Affected:** `step-2`
- **Affected Environments:** iOS 18.1 / 390x844, Android 15 / 360x780
- **Expected:** Discount calculated and displayed in order summary within 800ms
- **Actual:** Button enters permanent spinning state without response or error alert
- **Reproduction Steps:**
  1. Navigate to /checkout on iPhone 15 emulation (390px)
  2. Scroll to coupon accordion and tap to expand
  3. Type coupon 'WELCOME10'
  4. Tap 'Apply' CTA

```text
POST /api/v1/coupons returned 422 Unprocessable Entity - auth_token=Bearer [REDACTED_JWT]
```

---

### 2. [MINOR] Sticky bottom checkout CTA overlaps credit card expiry selector
- **Cluster ID:** `cluster-2` (Grouped 1 finding(s) across testers: tester-alicia)
- **Category:** `ux_friction`
- **Step Affected:** `step-3`
- **Affected Environments:** iOS 18.1 / 390x844
- **Expected:** Dropdown options clearly visible above sticky bottom CTA bar
- **Actual:** Sticky bar covers lower half of month options, forcing awkward double scrolling
- **Reproduction Steps:**
  1. Navigate to Step 3 payment fields
  2. Scroll down to Expiry Month dropdown
  3. Focus on month selector



---

## 🛡️ Privacy & Compliance Notice
All raw logs, session tokens, email records, and credit numbers have been subjected to CrowdQA zero-leak automated PII scrubbing.
