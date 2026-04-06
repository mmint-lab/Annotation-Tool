# SDOH Annotation Tool

Social Determinants of Health annotation platform. React frontend, FastAPI backend, MongoDB.

## Local Development

```bash
docker compose up --build -d
```

App runs at http://localhost:8000

```bash
docker compose ps          # Check status
docker compose logs -f     # View logs
docker compose down        # Stop
docker compose restart     # Restart
```

## Deploy to Railway (free tier)

### 1. Set up MongoDB Atlas (free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free M0 cluster
2. Create a database user and whitelist `0.0.0.0/0` for network access
3. Copy the connection string: `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/annotation_tool`

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) and connect your GitHub repo
2. Railway auto-detects the Dockerfile
3. Set these environment variables in Railway dashboard:

| Variable | Value |
|----------|-------|
| `MONGO_URL` | Your Atlas connection string |
| `DB_NAME` | `annotation_tool` |
| `JWT_SECRET_KEY` | Generate one: `openssl rand -hex 32` |
| `PORT` | `8000` (Railway sets this automatically) |

4. Deploy — Railway builds the Docker image and runs it

### 3. First user

Register at your Railway URL. The first user to register can set their role to `admin`.

## Project Structure

```
backend/
  server.py              # FastAPI API server
  requirements.txt       # Python dependencies
frontend/
  src/
    App.js               # App shell + routing
    api.js               # API base URL
    context/AuthContext.js  # Auth state management
    hooks/useToast.js    # Shared toast notifications
    utils/download.js    # File download helper
    components/
      Header.js          # Navigation bar
      AuthForm.js        # Login/register
      AccountPage.js     # User settings
      Home.js            # Landing page
      Dashboard.js       # Main dashboard (tabs)
      AnnotationInterface.js  # Sentence annotation UI
      AdminPanel.js      # User management
      AssignedDocsPanel.js
      ActiveDocsPanel.js
      ui/                # shadcn/ui components
tests/                   # API test files
Dockerfile               # Multi-stage production build
docker-compose.yml       # Local development
railway.toml             # Railway deployment config
```
