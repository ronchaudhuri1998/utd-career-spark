# Use a lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy backend code into container
COPY backend/ /app/backend/

# Move into backend folder
WORKDIR /app/backend

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Railway sets $PORT automatically, fallback to 8000 for local dev
ENV PORT=${PORT:-8000}

# Expose port (documentation; Railway still uses $PORT)
EXPOSE 8000

# Start FastAPI with uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
