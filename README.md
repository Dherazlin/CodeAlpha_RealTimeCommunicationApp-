# Korus

**One place for meetings, collaboration and communication.**

Korus is a modern, real-time video conferencing and collaboration platform designed with clean usability inspired by the best communication standards. Built using a robust full-stack architecture, Korus offers frictionless video calls, an intuitive interface, and powerful tools for team productivity.

## Features

- **Crystal Clear Video & Audio**: Real-time WebRTC media streams for low-latency communication.
- **Instant Screen Sharing**: Seamlessly share your screen, application window, or browser tab with participants.
- **Collaborative Whiteboard**: A real-time, shared canvas for brainstorming and sketching architecture with synced strokes.
- **Secure File Sharing**: Exchange files directly within the meeting room via robust persistent storage.
- **Real-Time Chat**: Send messages instantly to all participants in the active meeting.
- **Modern UI/UX**: A clean, fully responsive hybrid Light & Dark mode interface built with a consistent design system.
- **Secure Authentication**: JWT-based user authentication and meeting access controls.

## Tech Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** for styling and responsive design
- **Socket.io-client** for real-time signaling
- **WebRTC API** for peer-to-peer media streaming
- **Lucide React** for iconography
- **React Router** for navigation

### Backend
- **Node.js & Express.js**
- **Socket.io** for WebRTC signaling and real-time state synchronization
- **MongoDB & Mongoose** for database management
- **GridFS** for persistent file storage
- **JWT (JSON Web Tokens)** for secure authentication

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB connection string
- npm, yarn, or pnpm

### Environment Setup

1. **Backend Configuration**
   Navigate to the `server/` directory and create a `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=http://localhost:5173
   ```

2. **Frontend Configuration**
   In the root directory, create a `.env` file (if necessary) to point to your API:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

### Installation

1. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   # from the project root
   npm install
   ```

### Running the Application

1. Start the Backend Server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the Frontend Development Server:
   ```bash
   # from the project root
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`.

## Architecture & Deployment
- The Frontend is optimized to be deployed on platforms like **Vercel** or **Netlify**.
- The Backend server is optimized for deployment on platforms like **Render** or **Heroku**.
- **CORS Configuration**: Ensure CORS is properly configured on the backend for production environments to allow preflight requests from the deployed frontend.

## License
MIT License
