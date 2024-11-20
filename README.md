# CommTracker API

This repository contains the Docker setup for the **CommTracker API**, a containerized Node.js application. The setup includes a custom volume for TLS certificates and connects to an external production network.

## Prerequisites

Before running the application, ensure you have the following installed on your system:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

Additionally, ensure the following external resources are available:

1. **`node-tls` Volume**: This external volume must contain the necessary TLS certificates used by the application.
2. **`prod-network` Network**: This external Docker network is required for inter-container communication in production.

## Setup and Usage

### Build and Run the Application

1. **Set up Docker network and volume:**
   ```bash
   docker volume create --name node-tls
   docker network create --name prod-network
2. **Clone the repository:**
   ```bash
   git clone https://github.com/Laoag-City/commtracker-api.git
   cd commtracker-api
3. **Run the container instance:**
   ```bash
   docker-compose up --build

### Access the API

- **Local Development:**
   ```bash
   http://localhost:3004
   
- **Production Deployment:**
   ```bash
   https://your-domain.com:3004

### Persistent Volumes and Networks
   - node-tls Volume: Used to store TLS certificates. Ensure this volume contains valid certificates before running the application.
   - prod-network Network: Required for connecting this container with other production services.

### Stopping the Application
   - To stop the application and remove the container while preserving the external volume and network, run:
      ```bash
      docker-compose down

### File Structure
   - Dockerfile: Defines the build instructions for the container.
   - docker-compose.yaml: Configuration file for the containerized application, including volume and network settings.

### Notes
   - Ensure the node-tls volume contains valid TLS certificates to avoid runtime errors.
   - Modify the docker-compose.yaml file as needed to suit your specific environment.
### License
   - This project is licensed under the MIT License.

### TODO:
   - Provide clearer instructions for setting up environment variables (e.g., .env file configuration).
   - Detail any additional setup required for production deployment.
   - For further assistance, please contact the maintainers of this repository.
