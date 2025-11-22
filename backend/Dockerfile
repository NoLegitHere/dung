FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Run migrations and seed data, then start app
CMD ["sh", "-c", "until python -c 'from app.db.session import engine; engine.connect()' 2>/dev/null; do echo 'Waiting for database...'; sleep 2; done && alembic upgrade head && python -m app.initial_data && python -m app.update_passwords && uvicorn main:app --host 0.0.0.0 --port 8000"]

