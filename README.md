# Host Copilot

Host Copilot is a mock-data prototype for vacation rental operations. The FastAPI endpoints return stable response shapes, and the React screens use those endpoints through React Query.

## Run locally

Use Python 3.11+ and Node.js 16.14+. In two terminals:

### Backend, first-time setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload
```

### Backend, after setup

When the requirements are already installed in your virtual environment, activate it and start the server without reinstalling anything. Replace `test_env` with your virtual environment's directory name if it differs:

```bash
cd backend
source test_env/bin/activate
python3 -m uvicorn app.main:app --reload
```

If the virtual environment is already active in that terminal, just run `python3 -m uvicorn app.main:app --reload` from `backend`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the second terminal (typically `http://localhost:5173`). Vite proxies `/api` to the backend on port 8000.
