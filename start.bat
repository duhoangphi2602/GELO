@echo off
echo Starting all Gelo services...

npx concurrently -k -c "cyan,magenta,yellow" -n "FRONTEND,BACKEND,AI-API" "npm run dev --prefix gelo_frontend" "npm run start:dev --prefix gelo_backend" "cd gelo_ai && uvicorn main:app --reload --port 8000"
