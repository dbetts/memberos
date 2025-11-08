Below is a comprehensive, role‑organized **spec and feature checklist** for the platform (now branded **FitFlow**) that fully addresses the three core problems we identified: **retention & engagement**, **fragmented tech stacks**, and **lead conversion \+ capacity utilization**. Use this as your PRD/RFP backbone with partners and vendors.

---

## **0\) Scope & Principles**

* **Primary users:** multi‑site club operators, front desk & sales, coaches/instructors; **secondary:** members.

* **Design tenets:** API‑first, measurable outcomes, automation‑first, privacy by design, low lift to pilot.

* **Target scale (initial SLOs):** up to **100 locations**, **150k members**, **50k monthly bookings**, **p95 UI latency \< 250 ms** (cached), **API p95 \< 400 ms**, **99.9%** monthly uptime.

---

## **1\) Core Workflows (UIs)**

### **Operator Cockpit (exec & ops)**

* **KPI tiles:** monthly churn, 90‑day survival, class fill %, no‑show %, waitlist conversion, MRR, lead→trial, trial→join.

* **Cohort lenses:** by location, program, join month, acquisition source, instructor, age segment.

* **“Why is this changing?” explainer:** attribution panel showing interventions correlated with uplift.

* **A/B testing board:** experiments (offers, cadence, deposit policy) with guardrails and winner‑auto‑rollout.

### **Retention (risk & interventions)**

* **Risk heatmap:** segment counts (Low/Med/High/Critical) with drill‑through to member lists.

* **At‑risk roster:** reasons (streak break, missed bookings, billing risk, NPS dip), suggested next‑best‑action.

* **Playbooks library:** create/pause/version; triggers, audiences, channels, throttling, quiet hours.

* **Manual actions queue:** one‑click call/SMS/email for staff; track outcomes.

### **Capacity (class & facility utilization)**

* **Schedule view:** live fill %, predicted no‑shows, waitlist length, backfill status.

* **Auto‑backfill controls:** thresholds, cut‑off windows, promotion rules (priority by likelihood to attend).

* **Capacity planner:** add/remove sessions, instructor swaps, micro‑schedule optimizer (recommendations).

### **Fitness‑specific CRM (lead→trial→join)**

* **Pipeline stages:** New → Contacted → Tour → Trial → Close (configurable).

* **Lead capture:** embeddable web form/QR, walk‑in form, CSV import.

* **Scoring:** readiness score (signals from referral, website intent, trial activity).

* **Cadences:** multichannel (SMS/email/DM), SLA timers, auto‑tasks for front desk.

* **Activity timeline:** calls, messages, visits, offers, notes; dedup & merge.

### **Coach Console (member outcomes)**

* **Roster risk heatmap:** per program/class.

* **Adaptive plans:** view/edit progression, training blocks, recovery suggestions.

* **Check‑ins & outcomes:** log PRs, RPE, adherence; quick nudge templates.

### **Member App (or web/PWA; can be white‑label)**

* **Goals & program:** weekly plan with auto‑adjustments; calendar sync.

* **Booking:** sessions, waitlist, confirmations; push/email/SMS reminders.

* **Progress:** streaks, personal bests, recovery cues (optional wearables).

* **Community:** challenges, buddy passes, referrals, small‑group messaging.

* **Account & billing:** plan overview, freeze request with save‑offers, easy reactivation.

### **Front Desk “Autopilot”**

* **Unified lookup:** member/lead by name, phone, QR.

* **Suggested script:** offers, holds, save flows triggered by risk & context.

* **1‑tap actions:** book/rebook, send pass, collect deposit, process reactivation.

---

## **2\) Intelligence & Automation**

### **Churn‑Risk Model**

* **Features:** attendance velocity/delta, streak breaks, missed bookings, plan type, price sensitivity, payment risk, NPS/sentiment proxy, seasonality.

* **Outputs:** 0–100 risk score, confidence, **reason codes** (human‑readable).

* **Ops:** daily batch \+ event‑driven updates; drift monitoring; override capability.

### **No‑show Prediction**

* **Features:** member history, time‑of‑day, day‑of‑week, instructor, class type, booking window, seasonality.

* **Outputs:** probability of no‑show; windowed confidence.

* **Actions:** auto‑confirmations, reminders, deposit prompt, **waitlist promotion** rules.

### **Next‑Best‑Action (NBA)**

* **Policy engine:** if risk\>threshold & reason=streak break → **Streak Save** SMS; if freeze intent → **Freeze Rescue** email \+ offer.

* **Constraint solver:** rate limits per member, quiet hours by timezone, consent checks, channel fallback.

### **Experimentation & Attribution**

* **A/B/n:** randomization, holdouts, sequential testing.

* **Attribution:** uplift on tenure, class attendance, booking adherence, MRR; counterfactual estimates.

* **Reporting:** experiment cards with confidence intervals & decision notes.

---

## **3\) Data Model (canonical objects)**

* **Member**: id, name, contact, demographics, consents, join date, plan\_id, home\_location, external\_ids\[\], tags\[\].

* **Location**: id, name, timezone, capacity attributes.

* **Session (Class/PT)**: id, type, instructor\_id, location\_id, start/end, capacity.

* **Booking**: id, member\_id, session\_id, status (booked|attended|no‑show|canceled), source, deposit.

* **CheckIn**: id, member\_id, location\_id, timestamp, method (turnstile|kiosk|manual).

* **Lead**: id, contact, source (UTMs), stage, owner, readiness\_score, activities\[\].

* **Message**: id, member\_id/lead\_id, channel, template\_id, send\_time, status, engagement.

* **Payment**: id, member\_id, plan\_id, amount, cycle, status, next\_bill\_date, dunning\_state.

* **Outcome**: id, member\_id, type (streak, PR, VO₂ proxy, adherence), value, date.

* **RiskScore**: member\_id, score, reason\_codes\[\], calculated\_at.

* **Offer**: id, name, value (credit/discount/free PT), eligibility rules, expiry.

* **Consent**: member\_id, channel (SMS/email/push/wearables), opt‑in state, timestamps, proof.

Provide **OpenAPI/GraphQL schemas** for these and a **CDC event catalog** (member.created, booking.no\_show, risk.updated, playbook.fired, etc.).

---

## **4\) Integrations (connectors)**

**Club Ops Systems (Phase 1):** ABC Fitness, Mindbody, Xplor/Glofox

* Auth flows (OAuth/API keys), import & nightly backfill, webhooks for bookings/check‑ins/payments, idempotent upserts, merge logic.

**Messaging:** Twilio (10DLC/short code), SendGrid/Mailgun; **Push:** FCM/APNs (optional).

**Payments:** Stripe (plans, coupons, credits), **read‑only** for checking dues status (or write where contracted).

**Access Control (optional):** Kisi/Brivo for check‑ins.

**Wearables (optional/opt‑in):** Apple HealthKit, Google Fit, Garmin, Fitbit, Whoop, Oura (scoped data: workouts, HR, sleep summaries).

**Calendars (optional):** Google/Microsoft for member session sync.

**Healthcare‑adjacent (export only, not a medical device):** basic FHIR‑style JSON summary for referral partners.

**BI/Export:** Snowflake/BigQuery S3 sink; scheduled CSV extracts; Looker/Tableau connectors.

---

## **5\) Communications, Templates, & Compliance**

* **Template studio:** SMS/Email/Push with brand kit (colors, logo), liquid‑style variables (`{{first_name}}`, `{{class_name}}`), previews.

* **Libraries:** Streak Save, Freeze Rescue, Win‑back \<30d, “No‑show follow‑up,” “First‑week nurture,” Referral ask.

* **Cadence rules:** send windows by member timezone, frequency caps, channel fallback, priority queues.

* **Deliverability:** link tracking (toggle), domain auth (SPF/DKIM), bounce & complaint handling, SMS 10DLC registration, opt‑out keywords (STOP/UNSUBSCRIBE), re‑opt flows, audit of consent proofs.

* **Regulatory:** TCPA/CTIA (US), CASL (CA), GDPR/CCPA/CPRA—per‑channel consent, data subject requests (export/delete), **DPA** templates.

---

## **6\) Capacity & Revenue Mechanics**

* **Predicted fill curve:** session‑level fill forecast; “overbook OK” flags.

* **Auto‑backfill:** rank waitlist by show‑probability & response speed; auto‑promote until cut‑off.

* **Deposits & credits:** rules by class type/time; auto‑refund or credit on attendance.

* **Policy testing:** A/B deposit amounts, reminder timing, penalty grace periods; measure churn/CSAT impact.

* **Schedule optimizer:** recommend adding/removing sessions based on consistent waitlists/no‑show pockets; instructor load balance.

---

## **7\) Programs, Outcomes & Personalization**

* **Program builder:** templates for goals (fat loss, strength, longevity), blocks, progressions; attach to cohorts.

* **Adaptive engine:** adjusts weekly plan from adherence, effort (RPE), simple wearable proxies; suggests make‑up sessions.

* **Outcome tracking:** streak days, class adherence %, PRs; optional tests (e.g., 6‑min walk proxy, submax HR step test).

* **Gamification:** streak badges, leaderboards (opt‑in), challenges with prizes; anti‑cheat checks.

* **Referrals & buddies:** referral links/codes, track rewards; “bring‑a‑friend” passes tied to sessions.

---

## **8\) Admin, Security & Governance**

* **RBAC:** roles (Org Admin, Location Manager, Coach, Front Desk, Analyst, Marketer), custom permissions.

* **SSO & provisioning:** SAML/OIDC SSO; SCIM user provisioning; MFA; password policies.

* **PII vault & secret management:** field‑level encryption at rest; KMS; tokenization of sensitive values; **TLS 1.2+** in transit.

* **Audit logs:** all admin actions, data exports, consent changes, playbook edits.

* **Data residency:** US/EU region selection; configurable retention windows per object.

* **Compliance roadmap:** SOC 2 Type II in year 1; ISO 27001 target; vendor risk reviews.

---

## **9\) DevX, Extensibility & Ops**

* **APIs:** REST \+ GraphQL; **webhooks** (HMAC verified); idempotency keys; pagination; filter/sort; rate limits.

* **SDKs & tools:** TypeScript SDK; Postman collection; sample app; CLI for imports/seeding; event simulator.

* **Feature flags:** per‑org, per‑location; kill switches for automations.

* **Observability:** metrics (Prometheus/OpenTelemetry), tracing, structured logs; alerting (PagerDuty/Slack).

* **Jobs & queues:** retry with backoff; DLQ; cron scheduler; backfills; partition strategies for large orgs.

* **Backups & DR:** daily encrypted backups; **RPO ≤ 24h**, **RTO ≤ 4h**.

* **Environment strategy:** sandbox (fake data), staging, prod; data masking in non‑prod.

---

## **10\) Data Import, Quality & Migrations**

* **Imports:** guided CSV mapper for members/leads/bookings; preflight validation; dry‑run diffs; resumable uploads.

* **Deduplication:** identity resolution (email/phone \+ fuzzy name); merge rules & logs.

* **Data hygiene:** phone/E.164 validation, email verification, timezone inference; “bad data” queue.

* **Change history:** versioning of records; undo for destructive operations (when feasible).

---

## **11\) Reporting & ROI**

* **Dashboards:** retention, capacity, CRM, outcomes, revenue.

* **Attribution:** intervention exposure vs. control; tenure/LTV/margin impact.

* **Exports:** scheduled PDFs to execs; CSV to ops; BI sync.

* **Benchmarking (opt‑in):** anonymized peer medians per segment & region.

---

## **12\) Mobile, Accessibility & Localization**

* **Member PWA/native wrapper:** offline booking previews, push notifications, biometric login.

* **Staff mobile:** quick roster, check‑ins, manual actions.

* **Accessibility:** WCAG 2.2 AA; keyboard nav; ARIA semantics.

* **Localization:** i18n framework; currencies; regional date/time formats; multi‑timezone scheduling.

---

## **13\) Packaging & Commercial**

* **Plans:** Core (Member Graph \+ Playbooks \+ CRM), Growth (Attribution, A/B, Auto‑backfill), Plus (Wearables, Healthcare exports).

* **Billing metrics:** per active member/month \+ usage (messages).

* **Entitlements:** per plan feature flags; overage alerts.

---

## **14\) Acceptance Criteria (pilot‑ready “Definition of Done”)**

**Retention**

* Risk scores generated & refreshed at least **daily**; **≥ 80%** of at‑risk members carry ≥1 reason code.

* Three default playbooks live (**Streak Save**, **Freeze Rescue**, **Win‑back \<30d**); send windows/quiet hours enforced; opt‑out honored in ≤ 60 seconds.

**Capacity**

* No‑show predictions are available for **100%** future bookings within 1 minute of booking change.

* Auto‑backfill: promotes from waitlist with configurable cut‑off; audit trail for each promotion.

**CRM**

* Lead capture works via web form \+ CSV; dedup on create; SLA timers & default cadence installed.

* Pipeline conversion report by source & location.

**Integrations**

* One system of record (e.g., ABC or Mindbody) connected; members, bookings, check‑ins, payments synced; webhook retries with idempotency.

**Outcomes & Programs**

* Program templates deployable to cohorts; adherence tracked; simple PR logging.

**Reporting & Attribution**

* Pilot dashboard with baseline vs. live metrics; experiment board operational with at least one A/B test running.

**Security & Compliance**

* RBAC enforced; SSO option; audit log visible; per‑channel consent recorded; DSR (export/delete) flow demonstrable.

**Reliability**

* Health checks & status page; **99.9%** availability target for pilot month; p95 API under **400 ms** for read endpoints at pilot scale.

---

## **15\) Nice‑to‑Haves (post‑pilot)**

* **Schedule optimizer v2:** linear programming for staff/room constraints.

* **Dynamic pricing for drop‑ins** (if supported by POS).

* **Community v2:** member‑led groups, instructor chat rooms (moderated).

* **Social proof:** “people like you booked…” (privacy‑safe aggregation).

* **Corporate/household accounts:** dependents & employer billing.

---

## **16\) Risks & Mitigations**

* **Data quality from legacy systems:** build robust mappers, tolerance for missing fields, and reconciliation reports.

* **Messaging compliance:** strict consent capture, quiet hours, STOP/HELP handling; periodic audits.

* **Model trust:** reason codes \+ human override; A/B test model‑led actions vs. rules to prove lift.

* **Change management:** staff training kits, in‑app guides, “safe mode” to pause automations instantly.

---

### **TL;DR checklists**

**Must‑have to solve the 3 core problems**

* **Retention:** churn‑risk scoring \+ playbooks \+ outcome tracking \+ community hooks.

* **Fragmentation:** API‑first Member Graph, connectors, event/webhook bus, unified IDs, consent/PII governance.

* **Conversion & Capacity:** fitness‑specific CRM \+ no‑show prediction \+ waitlist auto‑backfill \+ deposit/credit policies \+ schedule insights.


## **A) Architecture & Platform**

* **ARCH‑01 (M)**: React/TS SPA \+ API layer. Single tenant to start; path to multi‑tenant.

* **ARCH‑02 (M)**: **Member Graph** service (canonical objects: Member, Session, Booking, Lead, Message, Payment, Outcome, RiskScore).

* **ARCH‑03 (M)**: Event bus (**booking.created**, **booking.updated**, **booking.no\_show**, **checkin.created**, **risk.updated**, **playbook.fired**, **lead.stage\_changed**).

* **ARCH‑04 (M)**: Background jobs: nightly backfills, risk scoring, experiment calculators, data hygiene.

* **ARCH‑05 (M)**: Feature flags per org (Playbooks on/off, Auto‑backfill on/off, Deposits on/off).

* **ARCH‑06 (M)**: Environments: **sandbox → staging → prod**; masked data outside prod.

* **ARCH‑07 (S)**: Webhook framework (HMAC signed; retries with backoff).

---

## **B) Data & Identity (Member Graph)**

* **DATA‑01 (M)**: Identity resolution (email, phone E.164, provider external\_ids). Merge duplicates with audit trail.

* **DATA‑02 (M)**: Minimal schema:

  * **Member**: id, first/last, email, phone, dob?, gender?, home\_location\_id, plan\_id?, join\_date, status, tags\[\], consent{sms,email,push,wearables}.

  * **Session**: id, class\_type, instructor\_id, location\_id, start/end, capacity.

  * **Booking**: id, member\_id, session\_id, status{booked|attended|no\_show|canceled}, source, deposit\_cents?.

  * **CheckIn**: id, member\_id, location\_id, ts, method.

  * **Lead**: id, contact, source, utm\_\*, stage, owner, score, created\_at.

  * **Message**: id, person\_id, channel, template\_id, sent\_at, status, engagement.

  * **Payment**: id, member\_id, plan\_id, amount\_cents, cycle, status, next\_bill\_on.

  * **Outcome**: id, member\_id, type{streak,adherence,PR,vo2\_proxy}, value, date.

  * **RiskScore**: member\_id, score(0‑100), reasons\[\], updated\_at.

* **DATA‑03 (M)**: Validation (emails, phone, timezone inference, required fields).

* **DATA‑04 (S)**: Data quality dashboard (dupes, invalid phone/email, missing consents).

---

## **C) Integrations (Fitness Studio Stack)**

* **INT‑01 (M)**: One system of record connector (choose **ABC** or **Mindbody** first):

  * Import members, plans, classes, bookings, check‑ins, payments.

  * Webhooks or polling for changes; idempotent upserts.

* **INT‑02 (M)**: **Messaging**: Twilio (SMS) \+ SendGrid/Mailgun (email).

* **INT‑03 (S)**: **Payments**: Stripe read (status, invoices); optional write for deposits/credits.

* **INT‑04 (C)**: Wearables (HealthKit/Google Fit/Garmin/Fitbit/Whoop/Oura) via opt‑in OAuth.

---

## **D) Retention & Playbooks (Wireframe: Retention)**

* **RET‑01 (M)**: **Risk heatmap** (Low/Med/High/Critical) with counts & drill‑down list.

* **RET‑02 (M)**: **At‑risk roster** table with reason codes:

  * (a) Streak break (no check‑in ≥ X days)

  * (b) Missed bookings ≥ N in last Y days

  * (c) Billing risk (failed/overdue)

  * (d) NPS/sentiment dip (if available)

* **RET‑03 (M)**: **Playbooks** CRUD \+ versioning:

  * Triggers: 7‑day no check‑in, missed 2 classes, freeze request, canceled \<30d, overdue payment.

  * Audience filters (location, plan, tag).

  * Channels (SMS, email).

  * Throttling (max N per week), quiet hours by timezone, per‑channel consent checks.

  * Manual “send now” for selected cohort.

* **RET‑04 (M)**: Execution engine (rules now; model later): enqueue messages; status & outcomes.

* **RET‑05 (S)**: **Freeze Rescue** flow: intercept freeze intent (imported or UI) with save offer; track accept/decline.

* **RET‑06 (S)**: **Win‑back \<30d** post‑cancel series (multi‑step cadence).

* **RET‑07 (C)**: In‑app challenges, buddy passes, referral codes.

---

## **E) Capacity, No‑shows & Waitlists (Wireframe: Capacity \+ Dashboard)**

* **CAP‑01 (M)**: Today/7‑day **schedule** view: capacity, booked, predicted no‑show %, waitlist length.

* **CAP‑02 (M)**: **No‑show scoring v0** (heuristic):

  * features: member’s show rate, class type, day/time, booking lead time, instructor.

  * output: probability 0‑1; threshold configurable.

* **CAP‑03 (M)**: **Confirmations & reminders**:

  * T‑24h: confirmation nudge; T‑2h: reminder (if not confirmed).

  * One‑tap confirm/cancel; update booking status.

* **CAP‑04 (M)**: **Auto‑backfill** waitlist:

  * Rank by (1‑ no‑show prob) × response speed; promote until cutoff; notify promoted.

  * Audit trail of promotions; don’t double‑book.

* **CAP‑05 (S)**: **Deposits/credits** policy: require deposit for high no‑show risk or peak times; auto‑credit upon attendance.

* **CAP‑06 (C)**: Micro‑schedule optimizer (recommend adding/suppressing classes by recurring waitlists/empties).

---

## **F) Fitness‑Specific CRM (Wireframe: CRM)**

* **CRM‑01 (M)**: Stages (configurable): New → Contacted → Tour → Trial → Close.

* **CRM‑02 (M)**: **Lead capture**: embeddable form \+ manual add \+ CSV import (dedupe on phone/email).

* **CRM‑03 (M)**: **Lead scoring v0** (0‑100): source weight (Referral\>Walk‑in\>Web\>Ad), engagement (site, replies), proximity to class booking.

* **CRM‑04 (M)**: **Cadences**: templates for Call/SMS/Email with SLA timers; auto‑create tasks when overdue.

* **CRM‑05 (S)**: Pipeline analytics (lead→trial, trial→join, by source, by location).

* **CRM‑06 (C)**: Two‑way SMS inbox per location (assignable to staff).

---

## **G) Coach Console (Wireframe: part of Retention / later page)**

* **COACH‑01 (S)**: Roster risk heatmap per program/class.

* **COACH‑02 (S)**: Quick nudges to a member or cohort (use playbook templates).

* **COACH‑03 (C)**: Simple outcomes logging (RPE, PRs, adherence %).

---

## **H) Member Experience (PWA/Portal)**

* **MEM‑01 (M)**: **Bookings**: list, confirm/cancel, join waitlist; reminders; iCal export.

* **MEM‑02 (S)**: **Goals & streaks**: show weekly target, current streak; celebrate check‑ins.

* **MEM‑03 (C)**: Basic **program view** (read‑only) with suggested next class/workout.

---

## **I) Communications & Compliance**

* **COM‑01 (M)**: **Template studio** with variables (`{{first_name}}`, `{{class_name}}`, `{{start_time}}`, `{{studio_name}}`).

* **COM‑02 (M)**: Per‑channel **consent tracking**; STOP/UNSUBSCRIBE handling; re‑opt flow.

* **COM‑03 (M)**: Quiet hours by member timezone; daily/weekly send caps.

* **COM‑04 (S)**: Domain auth for email (SPF/DKIM) checklist; bounce & complaint webhooks.

* **COM‑05 (S)**: 10DLC registration fields (brand/campaign) stored for audit.

**Pre‑built starter templates (ship with app):**

* **TPL‑01** Streak Save (SMS)

* **TPL‑02** Freeze Rescue (Email)

* **TPL‑03** Win‑back \<30d (SMS)

* **TPL‑04** No‑show Follow‑up (SMS)

* **TPL‑05** First‑Week Nurture (Email)

---

## **J) Reporting, Attribution & Experiments**

* **REP‑01 (M)**: **Dashboard KPIs**: churn %, 90‑day survival, class fill %, no‑show %, waitlist conversion %, lead→trial→join, MRR.

* **REP‑02 (M)**: Segment filters (location, class type, instructor, plan, source, join month).

* **REP‑03 (S)**: **Experiment board**: A/B flag, participants, uplift on (attendance, tenure, conversion).

* **REP‑04 (C)**: PDF/CSV scheduled exports.

---

## **K) Security, Privacy & Reliability (NFRs)**

* **SEC‑01 (M)**: RBAC roles: OrgAdmin, LocationManager, Coach, FrontDesk, Marketer, ReadOnly.

* **SEC‑02 (M)**: SSO (OIDC/SAML) optional; MFA for staff; strong password policy.

* **SEC‑03 (M)**: PII encryption at rest; TLS 1.3+ in transit; secrets in KMS/.env vault.

* **SEC‑04 (M)**: Consent proofs & audit log for data changes and outbound messages.

* **SEC‑05 (S)**: DSR flows (export/delete) within 30 days (GDPR/CCPA).

* **REL‑01 (M)**: p95 API \< 400 ms (read), UI p95 \< 250 ms (cached), uptime 99.9% for pilot.

* **OBS‑01 (M)**: Structured logging, metrics, traces; alerting for job failures & webhook retries.

---

## **L) API & Events (developer contract)**

* **API‑01 (M)**: REST endpoints (illustrative):

  * `GET /members?query=` …, `POST /members/merge`,

  * `GET/POST /bookings`, `POST /bookings/:id/confirm`, `POST /bookings/:id/cancel`,

  * `GET/POST /leads`, `POST /leads/:id/advance`,

  * `GET/POST /playbooks`, `POST /playbooks/:id/run`,

  * `GET /risk/:member_id`, `POST /messages/send`.

* **API‑02 (M)**: Webhooks (HMAC): `booking.created|updated|no_show`, `checkin.created`, `member.updated`, `playbook.fired`.

* **API‑03 (S)**: GraphQL read API for dashboards.

---

## **M) Models & Rules (baseline; replaceable with ML later)**

* **ML‑01 (M)**: **Churn Risk v0 (rules \+ logistic baseline)**

  * Score components (weight examples):

    * No check‑in ≥ 7d (+25), ≥ 14d (+40)

    * Missed ≥2 bookings last 14d (+20)

    * Overdue payment (+25)

    * NPS ≤ 6 (+15)

    * Attendance trend ↓ month‑over‑month (+10)

  * Normalize 0‑100; expose **reason\_codes** array; update daily \+ on events.

* **ML‑02 (M)**: **No‑show v0 (heuristic)**

  * p \= weighted avg of: member no‑show rate, class type factor, time‑of‑day factor, booking lead‑time, instructor factor.

  * Thresholds: p≥0.45 → send extra confirm; p≥0.6 → require deposit (if enabled).

* **ML‑03 (S)**: Next‑Best‑Action policy: map `reason_code` → template, with channel fallback.

---

## **N) Admin & Ops**

* **ADM‑01 (M)**: Locations, hours, class types, deposit/credit policies, cancellation windows (per location).

* **ADM‑02 (M)**: Staff & roles management; instructor profiles.

* **ADM‑03 (S)**: Brand kit (logo, colors) applied to emails/SMS links & member portal.

---

## **O) QA, Telemetry & Acceptance (Definition of Done)**

* **ACC‑RET (M)**:

  * ≥80% of at‑risk members have ≥1 reason code; playbooks fire within 5 minutes of trigger.

  * Opt‑out/STOP honored within 60 seconds.

* **ACC‑CAP (M)**:

  * No‑show scores computed for 100% future bookings within 60s of create/update.

  * Auto‑backfill promotes correctly and logs each promotion.

* **ACC‑CRM (M)**:

  * Lead dedupe on import/create; default SMS/email cadences attach to Trial stage; SLA timers visible.

* **ACC‑REP (M)**:

  * Dashboard KPIs match truth tables from connector within ±1%.

* **ACC‑SEC (M)**:

  * RBAC enforced; audit log captures admin actions, data exports, playbook changes.

**Instrumentation (emit metrics):**

* `churn_risk.update.time_ms`, `playbook.fired.count`, `sms.sent|delivered|failed`,

* `booking.noshow.predicted`, `auto_backfill.promoted.count`,

* `crm.sla.breaches`, `lead.conversion.rate`,

* `api.latency.p95`, `job.failure.count`.

---

## **P) Rollout Plan (60–90 days)**

* **Sprint 1 (Weeks 1–3)**: INT‑01 (one connector), DATA‑01..03, RET‑01..03 (Streak Save live), REP‑01, COM‑01..03, SEC‑01..03.

* **Sprint 2 (Weeks 4–6)**: CAP‑01..04 (auto‑backfill), CRM‑01..04, RET‑04, API‑01..02, ACC‑RET/CAP.

* **Sprint 3 (Weeks 7–9)**: REP‑02, CRM‑05, RET‑05..06, MEM‑01, ADM‑01..02, OBS‑01, REL‑01.

* **Optional (Weeks 10–12)**: CAP‑05, COACH‑01..02, API‑03, COM‑04..05.

---

## **Q) Data Seeds (for demos & testing)**

* **SEED‑01 (M)**: Generate 2k–10k members with realistic attendance patterns; create bookings, waitlists, leads, and messages to exercise all dashboards.

* **SEED‑02 (S)**: Edge cases (duplicate phones/emails, missing DOB, legacy plans, invalid timezones).

---

### **What to implement first (strict MVP to hit pain points)**

1. **Playbooks (Streak Save, Freeze Rescue, Win‑back)** with consent, quiet hours, and throttling.

2. **No‑show prediction \+ confirmations \+ auto‑backfill** to keep classes full.

3. **Lead pipeline with cadences** to fix conversion gaps.

4. **KPI dashboard** to prove retention/fill improvements.
