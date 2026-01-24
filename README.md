# 📝 Annotation Tool

Social Determinants of Health annotation platform with React frontend and FastAPI backend.

## 🚀 Quick Start

```bash
./deploy.sh
```

This will:
- Install Docker if needed
- Build and start the application
- Show you access URLs

## 🌐 Access

- **Local**: http://localhost:8000
- **Network**: http://YOUR_IP:8000 (share with others)

## 🛠️ Management

```bash
docker-compose ps          # Check status
docker-compose logs -f     # View logs  
docker-compose down        # Stop
docker-compose restart     # Restart
```

## 🔧 Troubleshooting

**Can't access from other machines?**
```bash
sudo ufw allow 8000
```

**Port 8000 in use?** Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:8000"  # Use port 8080
```

That's it! 🎯
