# Walkthrough: Demo React Application and Mock Server

I have successfully created the showcase React application and the mock backend server as planned. Here's a breakdown of what was implemented.

## Directory Structure
Two new projects were added to `C:\Github\web-framework`:
1. `demo-api`: An Express.js backend exposing 24 REST endpoints.
2. `demo-app`: A Vite + React frontend application connecting to the API.

## Frontend (React Application)
> [!NOTE]
> The UI has been styled using Vanilla CSS with a focus on premium aesthetics. It includes glassmorphism effects, a dynamic color palette, hover micro-animations, and standard responsive grids.

The frontend includes a routing setup and implements the required pages:
- **Login**: Simulates authentication.
- **Dashboard**: Retrieves data such as total sales and conversion rates, and includes buttons specifically designed for testing chaos logic (delays and flaky endpoints).
- **Products & Cart**: Displays a list of products and items in the user's cart.
- **Generic Views**: The remaining required pages (Orders, Analytics, Notifications, Profile, Payments, Search) utilize a generic viewer component for rapid prototyping, which renders the JSON response from the API in a sleek code block.

## Backend (Express API Server)
The `server.js` file in `demo-api` contains a fully functional backend API with over 20 endpoints covering all the requested domains.

> [!TIP]
> **Advanced Mocking Ready**: The server exposes dedicated chaos endpoints:
> - `GET /api/chaos/delay`: Injects a fixed 2-second delay to test timeout/latency configurations.
> - `GET /api/chaos/flaky`: Randomly returns a 500 internal server error 50% of the time, perfect for testing retry logic in Playwright.

## Framework E2E Integration
A new feature file, `demo-app.feature`, has been added under the `app/src/features/ui/` directory with two scenarios:
1. `User can login and view the dashboard`
2. `User can view products`

Accompanying step definitions were added to `app/src/step-definitions/demo-app-steps.js`. 

## How to Test and Showcase Mountebank
To use this as a PoC for API Mocking:
1. Start the API server: `cd demo-api && npm start` (Running on port 3001).
2. Start the React app: `cd demo-app && npm run dev` (Running on port 5173).
3. Ensure the UI `.env` or config is pointing Mountebank's `TARGET_URL` to `http://localhost:3001` and your UI app is hitting Mountebank at `http://127.0.0.1:4545`.
4. Run `npm run test "@demo-app"` in the framework repository. Mountebank will proxy the UI requests to the `demo-api` server, record them, and you can switch to `MOCK_MOUNTEBANK_PLAYBACK=true` afterward!
