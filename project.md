# Host Copilot

Host Copilot is a runnable prototype of an AI operations layer for vacation-rental hosts. It brings guest replies, channel consistency checks, a weekly portfolio brief, and an estimated AI cost view into one interface. Its sample portfolio is synthetic and stored locally, so the project demonstrates the product workflow without connecting to live booking platforms.

## The problem it explores

An independent host or small property manager may run several listings across multiple booking channels without dedicated operations staff. They need to answer guests quickly, sometimes in another language; keep calendars and nightly rates aligned; spot unresolved guest issues and availability gaps; and understand the cost of adding AI to the workflow.

Host Copilot explores how those jobs might fit into a shared operations surface. It treats AI as assistance inside an existing property-management workflow: the host remains responsible for messages and operational decisions, and deterministic rules handle work that does not need a language model.

## Product walkthrough

The application opens in a unified inbox for synthetic guest conversations across English, Spanish, French, German, and Italian. Hosts can search and filter threads, review the conversation, and work with a suggested reply. The reply prompt uses the selected listing's amenities, check-in and check-out times, and house details as its source of truth. It asks the model to respond in the guest's language and to defer questions the listing data cannot answer.

Before making a model call, the backend checks the guest's latest message for sensitive keywords such as refund, injury, theft, or legal terms in several languages. A match skips drafting and returns a `needs_human` result. Otherwise, the draft is returned for editing and review. The interface's **Approve & Send** action appends the host's message to the local JSON thread and marks it as sent locally. It does not deliver a message to Airbnb, Vrbo, Booking.com, or a guest.

The Conflicts screen presents consistency issues derived from the local calendar and price files. Python rules flag overlapping bookings across channels, rate differences greater than 15% for the same listing and date, and calendar feeds whose recorded sync time is more than six hours old. Conflicts include severity and the relevant reservation, date, rate, or sync details. A host can mark an item reviewed; that choice is saved locally. The tool does not edit rates, reservations, or channel calendars.

The Weekly Brief combines locally computed portfolio statistics with a single model request for readable copy. Python calculates next-30-day occupancy, the longest open gap for a listing, an estimated revenue opportunity, a seven-day occupancy trend, an open inquiry whose latest guest message is older than 24 hours, a review containing a risk keyword, and the first detected conflict. Projected revenue multiplies the largest gap by the listing's average available nightly rate, falling back to the portfolio average when that listing has no price rows. The model receives these facts to produce a headline explanation, issue text, and suggested action; it does not calculate the displayed metrics. If the model response is not valid JSON, the API falls back to computed copy. **Regenerate** requests a fresh brief from the current files.

The Cost screen uses token counts recorded for reply drafts and weekly briefs. It groups calls by type, averages the recorded input and output token counts, applies the prototype's assumed monthly volumes, and calculates a projected euro cost for the Cheap, Mid, and Premium tiers. It also lists up to ten recent calls with their tier, token counts, timestamp, and estimated cost. Older log rows without a call type are treated as reply drafts so existing usage remains readable.

## How it is put together

The project has a React, TypeScript, Vite, and Tailwind frontend and a Python FastAPI backend. The frontend uses TanStack Query for API requests and their loading, error, and refresh states. Four screens are navigated inside a shared application shell.

The backend exposes JSON endpoints for the product workflows:

| Endpoint | What it provides |
| --- | --- |
| `POST /api/replies/draft` | A grounded reply draft or a human-review result |
| `GET /api/replies/threads` | Inbox thread summaries |
| `GET /api/replies/threads/{thread_id}` | A thread and its messages |
| `POST /api/replies/send` | Appends an approved reply to the local thread data |
| `GET /api/conflicts` | Detected conflicts, with an option to include reviewed items |
| `POST /api/conflicts/{conflict_id}/review` | Saves a reviewed conflict ID locally |
| `GET /api/brief/weekly` | A newly computed weekly brief |
| `GET /api/cost/summary?tier=mid` | Tier-specific monthly cost projection and recent call usage |
| `GET /api/listings/count` | Listing count for the conflict overview |

Reply drafting and weekly brief prose use the shared `llm_client` and append token usage to `backend/data/cost_log.json`. The conflict detector uses Python rules and makes no model call. The cost meter uses the tier's configured per-token rates and usage assumptions in `backend/app/pricing_config.py`; those rates are illustrative configuration values, not a provider invoice or a live billing feed.

The JSON files in `backend/data/` act as both sample input and lightweight local persistence. This keeps setup simple and makes it straightforward to inspect or edit the scenarios used in a demo. Vite proxies `/api` requests to the local FastAPI server, so the browser code does not depend on a hardcoded API port.

## Human control and current boundaries

The prototype puts a person between AI output and consequential action. Reply drafts are editable before they are stored in the local thread. Sensitive keyword matches skip drafting. Conflict records are informational and must be reviewed by the host. The weekly brief recommends; it does not make calendar changes. There is no automatic sending or conflict resolution.

This is a local demonstration, not a production property-management system. It uses synthetic records rather than live integrations, has no authentication or multi-tenant account model, and does not synchronize with booking channels. The reply safeguard is a keyword list rather than a complete understanding of tone or risk. Review detection is also a keyword scan, not sentiment analysis. Cost figures are projections based on configured rates and observed local token averages; no real billing records are retrieved. The LLM adapter currently has an Anthropic implementation, while the application-facing call interface is organized around capability tiers.

## Run locally

Start the backend and frontend in separate terminals. For an existing backend virtual environment, activate it and run:

```bash
cd backend
source test_env/bin/activate
python3 -m uvicorn app.main:app --reload
```

Replace `test_env` with the name of your environment if needed. If it is already active, run `python3 -m uvicorn app.main:app --reload` from `backend`.

In the other terminal:

```bash
cd frontend
npm run dev
```

For first-time installation steps, see [README.md](README.md).
