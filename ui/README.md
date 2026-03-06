# MediBox UI

React-based web interface for the Modular Smart Pillbox system.

## Project Overview

The MediBox UI provides a dashboard for monitoring and configuring the smart pillbox system. It communicates with the ESP32 Hub via REST API and WebSocket to provide real-time updates on pillbox status (lid open/closed, connection status) and manage medication reminders.

### Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Development

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Start the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.

### Mock Mode

The application includes a built-in mock mode for development without hardware.
When running in `dev` mode (`npm run dev`), the API client and WebSocket service automatically switch to simulation mode if the backend is not reachable or if explicitly configured.

- **Mock Data**: Simulated reminders and pillbox states are generated in `src/api/client.ts`.
- **WebSocket Simulation**: `src/api/websocket.ts` generates periodic `STATUS_UPDATE` events to test real-time UI updates.

## Deployment Guide

The UI is designed to be hosted directly on the ESP32's SPIFFS (SPI Flash File System).

### 1. Build for Production

Generate the static assets (HTML, CSS, JS) optimized for the microcontroller.

```bash
npm run build
```

This will create a `dist/` directory containing the production build.

### 2. Upload to ESP32

To serve the UI from the ESP32, you need to upload the contents of the `dist/` folder to the ESP32's filesystem.

**Recommended Tool: `mkspiffs` / PlatformIO**

If using PlatformIO:
1.  Copy the contents of `dist/` to your firmware's `data/` directory (e.g., `firmware/esp32_hub/data/`).
2.  Run the "Upload Filesystem Image" task in PlatformIO.

**Using Arduino IDE:**
1.  Install the "ESP32 Sketch Data Upload" plugin.
2.  Copy `dist/` contents to `firmware/esp32_hub/data/`.
3.  Select **Tools > ESP32 Sketch Data Upload**.

### Note on Gzip Compression

The build process (via `vite-plugin-compression`) generates `.gz` files. The ESP32 web server should be configured to serve these compressed files with the appropriate `Content-Encoding: gzip` header to save storage space and bandwidth.
