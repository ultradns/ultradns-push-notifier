FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the application files
COPY . /app

# Ensure the /app/data directory exists
RUN mkdir -p /app/data

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the backend port
EXPOSE 8087

# Run the application
CMD ["python", "app.py"]
