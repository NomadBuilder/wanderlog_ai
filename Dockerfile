# Use official Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8080

# Set work directory
WORKDIR /app

# Copy backend code
COPY backend/ /app/

# Copy Google credentials file (update filename if needed)
COPY backend/ai-test-394019-bdeabb69a360.json /app/

# Copy frontend assets
COPY frontend/assets /app/frontend/assets

# Install dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install functions-framework

# Expose port for Cloud Run
EXPOSE 8080

# Start the Functions Framework (entrypoint)
CMD ["functions-framework", "--target=wanderlog_ai", "--port=8080", "--source=main.py"] 