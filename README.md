# CommTracker API

This repository contains the Docker setup for the **CommTracker API**, a containerized Node.js application. The setup includes a custom volume for TLS certificates and connects to an external production network.

## Prerequisites

Before running the application, ensure you have the following installed on your system:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

You also need to ensure the following external resources are available:

1. **`node-tls` Volume**: This external volume must contain the necessary TLS certificates used by the application.
2. **`prod-network` Network**: This external Docker network is required for inter-container communication in production.

## Setup and Usage

### Build and Run the Application

1. Setup docker network and volumes
   ```
   docker volume create --name node-tls
   docker network create --name prod-network

2. Clone the repository:
   ```bash
   git clone https://github.com/Laoag-City/commtracker-api.git
   cd commtracker-api

3. Run container instance
   ```bash
   docker-compose up --build

### Access the API

1. Access the API via
   ```
   http://localhost:3004
   https://your-domain.com:3004

### TODO: clearer instructions 
(e.g. setup dotenv or .env file)