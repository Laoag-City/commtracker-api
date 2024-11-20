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

### Persistent Volumes and Networks

node-tls Volume: Used to store TLS certificates. Ensure this volume contains the required certificates before running the application.
prod-network Network: Must be pre-configured to connect this container with other services.

### Stopping the Application
1. To stop the application, run:

   ```bash
      docker-compose down

This will stop and remove the container but preserve the external volume and network.

### File Structure

   Dockerfile: Defines the build instructions for the container.
   docker-compose.yaml: Configuration file for the containerized application, including volumes and networks.

### Notes
   Ensure the external node-tls volume contains valid TLS certificates to avoid runtime errors.
   Modify the docker-compose.yaml file as needed to match your specific environment.

### License
   This project is licensed under the MIT License.

For additional help or questions, please contact the maintainers of this repository.

### TODO: clearer instructions 
(e.g. setup dotenv or .env file)
