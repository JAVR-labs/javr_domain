<p style="display: flex;">
  <img style="margin: auto;" src="./Banner.jpg" alt="JAVR Domain banner">
</p>

# Welcome to JAVR Domain

> [!NOTE]
> This version is now considered legacy. A new system is under development.

JAVR Domain is a management platform for game servers and Discord bots. This version also has a page dedicated to
monitoring in-home terrarium. The project is divided into two main parts:

- **[Server Manager](server_manager)**: The core backend that manages game servers and Discord bots. It can be hosted
  on a powerful machine and wake up on demand.
- **[Website](website)**: A Next.js-based web interface that provides a user-friendly way to interact with all
  services.

This architecture allows the more powerful server to remain offline when not needed, saving energy while keeping the
main website available on a low-power host.

---

## Key Features

### Game Server Management

- **Supported Servers**: All supported servers with their configuration templates are [here](docs/server_configs).
- **Control**: Start, stop, and monitor server status directly from the web interface.
- **Live Monitoring**: Real-time status updates and player lists (Features available vary by server).

### Discord Bot Management

- **Bot Control**: Start and stop Discord bots launched through the platform.
- **Status Monitoring**: Check live status and Lavalink connection for music bots.
- **Integration**: Bots can be configured to start automatically with the server.

### Network & Infrastructure

- **ZeroTier Integration**: Monitor ZeroTier network status and manage users/members directly from the dashboard.
- **WOL (Wake-on-LAN)**: The website can wake up the server manager host on request.

### Terrarium Control (Terra Metrics)

- **Sensors**: Real-time temperature and humidity tracking.
- **Controls**: Remote light control and other Arduino-based interactions.

---

## Project Structure

- `/server_manager`: Backend logic for server and bot control (Node.js).
- `/website`: Frontend web interface (Next.js & Socket.io).
- `/json_templates`: Configuration templates for adding new servers and bots.

---

## Getting Started

> [!NOTE]
> Basic configuration is generated on the first startup.

### 1. Server Manager

1. Navigate to `server_manager/`.
2. Install dependencies: `npm install`.
3. Configure your servers in `configs/`. (See [templates](docs)).
4. Start the manager: `npm start`.

### 2. Website

1. Navigate to `website/`.
2. Install dependencies: `npm install`.
3. Configure the website and server manager connection in `configs/`.
4. Build and start: `npm run build && npm start` or use the helper script `python start.py`.

# Documentation

Documentation is primarily provided via code comments, docstrings and [docs](/docs).
