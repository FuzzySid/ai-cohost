# Host Copilot

Host Copilot is a mock-data prototype for vacation rental operations. The FastAPI endpoints return stable response shapes, and the React screens use those endpoints through React Query.

## Run locally

Use Python 3.11+ and Node.js 16.14+. In two terminals:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the second terminal (typically `http://localhost:5173`). Vite proxies `/api` to the backend on port 8000.
