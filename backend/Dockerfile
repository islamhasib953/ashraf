FROM python:3.11-slim

# Security: run as non-root user
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set ownership
RUN mkdir -p /app/chroma_db /home/appuser/.cache/huggingface && \
    chown -R appuser:appuser /app /home/appuser
USER appuser
ENV HOME=/home/appuser \
    HF_HOME=/home/appuser/.cache/huggingface

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
