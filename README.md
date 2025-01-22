# ultradns-push-notifier

This is a web-based application designed to configure push notification endpoints for UltraDNS. The app uses a **Flask backend** for managing API requests and a **React frontend** to provide a clean and user-friendly interface. It supports setting up notification platforms such as Microsoft Teams and Slack and will include Discord plus others in future updates.

## Features

- **Admin Password Management**: Set and log in with an admin password for secure access.
- **Multi-Step Setup Workflow**:
  - Select a notification platform (e.g., Microsoft Teams).
  - Configure the webhook for the platform.
  - Wait for UltraDNS test telemetry to verify the endpoint.
- **Dashboard**: View configured webhooks, including their type, status, token, and URL.

## Project Structure

```plaintext
root/
├── backend/             # Flask backend API for managing data and telemetry
│   ├── app.py           # Main Flask app
│   ├── requirements.txt # Backend dependencies
│   └── ...              # Additional backend files
├── frontend/            # React frontend for the user interface
│   ├── src/             # React source code
│   │   ├── App.js       # Main React component
│   │   └── ...          # Additional React components
│   ├── public/          # Static assets (e.g., logos, icons)
│   └── package.json     # Frontend dependencies
├── docker-compose.yml   # Docker Compose file for container orchestration
└── README.md            # Project documentation
```

## Installation and Setup

### Prerequisites

- **Docker** (https://www.docker.com/)
- **Docker Compose** (included with Docker Desktop or available separately)

### Environment

* `WEB_HOST` - The DNS hostname for your notifier. The application needs to be encrypted, so we use Traefik as a reverse proxy. It will automatically obtain a certificate for your host.
* `ACME_EMAIL` - The email used in the CSR created by Traefik.
* `FILTER_IPS` - When `FILTER_IPS` is enabled, the application will attempt to assert that only requests from UltraDNS are allowed to communicate with the webhooks by checking the `X-Forwarded-For` header and client IP.
* `DISABLE_GUI` - Setting this to `true` will disable access to the web interface. Notifications will still be pushed through the backend.

### Setup Instructions

1. Make a directory for the container and its data.
   ```bash
   mkdir -p ultradns-push-notifier/data/certificates
   ```

2. Download `docker-compose.yml` or create a file with the same name and paste its contents.
3. Create a `.env` file and add add the values from `example.env`
   - If you'd rather use your own reverse proxy, remove the Traefik service and labels from the compose manifest.
4. Pull and start the containers.
   ```bash
   docker compose up -d
   ```

### Dev Setup Instructions

1. Clone the repository:
2. Start the application using Docker Compose:
   ```bash
   docker compose -f docker-compose-dev.yml up --build -d
   ```

   This will:
   - Build the **udns-push-notifier-backend** and **udns-push-notifier-frontend** containers from their respective `backend` and `frontend` directories.
   - Start the containers as daemons.
   - Expose the backend on `http://localhost:8097` and the frontend on `http://localhost:3000`.

3. Access the application:
   - Open `http://localhost:3000` in your browser.

**Note:** UltraDNS requires `HTTPS`, so this application needs to be behind a reverse proxy if you want it to receive notifications. Non-development Compose file includes Traefik. In dev, this needs to be manually configured in your proxy of choice. I use Nginx Proxy Manager on my network, but you could just copy the Traefik config.

## Usage

1. Open the application in your browser (default: `http://localhost:3000`).
2. Follow the setup steps:
   - Log in or set an admin password (if not already configured).
   - Select a notification platform.
   - Enter the webhook URL.
   - Wait for UltraDNS to send test telemetry to verify the endpoint.
3. View and manage configured webhooks in the dashboard.

See [frontend/README.md](./frontend/README.md) for a visual demonstration.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature-name
   ```

3. Commit your changes:
   ```bash
   git commit -m "Description of changes"
   ```

4. Push to your fork:
   ```bash
   git push origin feature-name
   ```

5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

- Icons provided by [Icons8](https://icons8.com).
- Built using **Flask**, **React**, and **Docker**.
