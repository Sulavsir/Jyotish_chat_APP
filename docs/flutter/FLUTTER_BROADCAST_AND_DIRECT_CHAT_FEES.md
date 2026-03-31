# Flutter: broadcast vs direct chat — fees and how the web client matches the server

This document is **standalone**. It explains how **broadcast** and **direct (1:1) chat** differ, which **NR fees** apply when the client sends messages or questions, and how the **web app** computes previews so Flutter can do the same. The **server is always authoritative**; the client only needs correct **quotes** and **`totalNr`** on bundle endpoints to avoid `Pricing mismatch` errors.

---

## 1. Two different “broadcast” ideas

| Concept | Meaning | Typical fee source |
|--------|---------|---------------------|
| **Posting a broadcast** | Client creates a **new** broadcast (outreach to astrologers / queue). This is **not** the same as sending a chat line. | Platform rate **`BROADCAST_SEND`** (and optional first-broadcast discounts via prepare APIs). |
| **Broadcast-originated chat session** | A **chat** that was opened because an astrologer **accepted** a broadcast linked to that chat. While `reopenedAfterEnded` is false and a `broadcastMessage` row points at this `chatId`, the session is treated as **broadcast chat** for **per-message** pricing. | Platform **`BROADCAST_PER_MESSAGE`** per line (not the jyotish `chatMessageFee`). |
| **Pure direct chat** | 1:1 chat **not** in the broadcast-originated state above (e.g. started from “direct” flow, or chat reopened after end). | **`chatMessageFee`** on that astrologer if set and &gt; 0, else platform **`CHAT_PER_MESSAGE`**. |

Flutter must know **which session type** the active chat is: use the **`chat` object from your API** (e.g. `isBroadcastChat` / server rules below), not only the screen you navigated from.

---

## 2. How the server decides “broadcast session” vs “direct” (per message)

For **each** billable chat message, the backend loads the **chat** and checks:

- Is there a **`broadcastMessage`** record with **`chatId` = this chat?
- Is **`reopenedAfterEnded`** false?

If **yes** → **broadcast-originated session** → per-message cost = **`BROADCAST_PER_MESSAGE`**.

If **no** → **direct session** → per-message cost = astrologer **`chatMessageFee`** if &gt; 0, else **`CHAT_PER_MESSAGE`**.

**Astrologer earnings:** For broadcast session deductions, commission uses **`broadcastMessageCommissionPercent`**. For direct session, **`chatMessageCommissionPercent`**. (This affects payouts, not the client’s displayed “price per line” if you only show NRs to the user.)

**Unlimited plan / appointment window:** The server may skip deductions in specific cases (unlimited plan; inside a paid appointment window). Flutter should still show normal prices unless your API exposes those flags.

---

## 3. Platform rates vs astrologer `chatMessageFee`

| Key | Set by | Used for |
|-----|--------|----------|
| **`CHAT_PER_MESSAGE`** | Admin (platform coin rates) | Default **per message** in **direct** chat when the astrologer has **no** positive `chatMessageFee`. |
| **`BROADCAST_PER_MESSAGE`** | Admin | **Per message** in a **broadcast-originated** chat session (after accept). |
| **`BROADCAST_SEND`** | Admin | **Posting** a broadcast (initial send / prepare flows), not each line in an accepted chat. |
| **`FIRST_BROADCAST_DISCOUNT`** (etc.) | Admin | Optional discounts on **broadcast prepare** totals (web mirrors with `computeBroadcast*` helpers). |
| **`chatMessageFee`** | Per astrologer (admin / profile) | **Direct** 1:1 chat per message when **&gt; 0**; **ignored** for per-message price in broadcast-originated sessions (server uses `BROADCAST_PER_MESSAGE` there). |

Fetch rates from the same endpoint the web uses (e.g. **`GET /api/v1/coins/rates`** or your `coinService.getRates()` equivalent). Do not invent numbers on the device.

---

## 4. Sending a normal chat message (one line)

**Transport:** Web uses **Socket.IO** `chat:send` for real-time send; HTTP send may also exist. **Deduction runs on the server** when the message is accepted (`deductCoinsForMessage` with the rules in section 2).

**Client-side preview (web):**

- In **`ChatClientQuestionBundle`** and chat UI, **per-line NR** for bundles uses:
  - If **`chat.isBroadcastChat === true`** (broadcast-originated): **`BROADCAST_PER_MESSAGE`**.
  - Else: **`astrologer.chatMessageFee`** if &gt; 0, else **`CHAT_PER_MESSAGE`**.
- **`useChat` / start chat** may check balance against **`chatMessageFee`** or **`CHAT_PER_MESSAGE`** for **direct** entry (not broadcast session).

**Flutter:** For “will this message cost X?” previews, mirror the same branch as above using **chat classification from API** + **rates** + **astrologer profile**.

---

## 5. Posting broadcast questions from the dashboard (not the in-chat bundle)

On the web **Ask Questions** page, **Broadcast** mode uses:

- **`broadcastMessageService.getQuestionPricing()`** → admin **tiers** (bundle sizes and NR totals).
- Helpers like **`computeBroadcastBaseTotalNr`** / **`computeBroadcastTotalNrWithQ1Discount`** (client mirror of server **composed pricing** / DP).
- Payment / send flows that deduct **`totalNr`** agreed with **prepare** endpoints (not the same formula as simple `N × BROADCAST_PER_MESSAGE`).

So **broadcast “ask many questions at once” from the dashboard** is **tiered** and must match **prepare/send broadcast** APIs — do **not** reuse the in-chat **`send-direct-question-bundle`** formula for that.

---

## 6. In-chat multi-question bundle (direct chat screen)

Endpoint: **`POST /api/v1/chat/send-direct-question-bundle`**

- **`totalNr` must equal** `questionItems.length × perMessageFee`, where **`perMessageFee`** is computed **exactly like section 2**:
  - Broadcast-originated chat → **`BROADCAST_PER_MESSAGE`**.
  - Else → **`chatMessageFee`** if &gt; 0, else **`CHAT_PER_MESSAGE`**.

The web builds `questionItems` in order, then sets **`totalNr = perMessageNr × questionItems.length`**. After success, the panel collapses and “waiting for reply” disables further sends until the astrologer answers.

**Bundle request (recap):** `POST /api/v1/chat/send-direct-question-bundle` with `astrologerId`, `questionItems[]` (`id` + `text`), and **`totalNr`** as above; optional `birthDetails`, `questionCategory`.

---

## 7. Summary table (client asking questions / sending lines)

| User action | Session type | What to charge (client preview / `totalNr`) |
|-------------|--------------|-----------------------------------------------|
| First message in **direct** 1:1 (no broadcast link) | Direct | `max(chatMessageFee, 0)` or `CHAT_PER_MESSAGE` if fee unset/zero |
| Message in chat **after broadcast accepted** | Broadcast-originated | `BROADCAST_PER_MESSAGE` per line |
| **Multi-line bundle** in chat | Same as row above or below | `count ×` that per-line fee |
| **New broadcast** from dashboard | N/A (not 1:1 chat yet) | Tiered **`totalNr`** from **broadcast question pricing** + prepare APIs, not `chatMessageFee` |

---

## 8. Flutter implementation checklist

1. **Load** platform rates (`CHAT_PER_MESSAGE`, `BROADCAST_PER_MESSAGE`, `BROADCAST_SEND`, discounts if needed).
2. **Load** astrologer **`chatMessageFee`** from profile when in 1:1 context.
3. **Classify chat**: from API response — e.g. **`isBroadcastChat`** or equivalent; if you only have raw flags, mirror server: `broadcastMessage` exists on chat **and** not `reopenedAfterEnded`.
4. **Per-message fee** = `isBroadcastSession ? BROADCAST_PER_MESSAGE : (chatMessageFee > 0 ? chatMessageFee : CHAT_PER_MESSAGE)`.
5. **Normal send**: no `totalNr` in body; server deducts. Optionally show **per-message fee** from step 4.
6. **`send-direct-question-bundle`**: `totalNr = questionItems.length × perMessageFee` from step 4.
7. **Broadcast dashboard flows**: use **broadcast prepare/pricing** APIs and **`totalNr`** from those responses, not the 1:1 bundle formula.

---

## 9. Why `Pricing mismatch` happens on bundles

The server recomputes `expectedTotal = count × perMessageFee` with **its** broadcast-session detection. If Flutter uses **`chatMessageFee`** while the server considers the chat **broadcast-originated**, **`totalNr`** will be wrong (e.g. server expects `2 × BROADCAST_PER_MESSAGE`, client sends `2 × chatMessageFee`). Fix the **session flag** and **per-line rate** first, then **`totalNr`**.
