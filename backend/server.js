require("dotenv").config(); // Load environment variables from .env
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// ✅ Allowed Origins (Modify for Production)
const allowedOrigins = [
  "http://localhost:3000",  // Local development
  "https://lo-olive.vercel.app"  // Replace with your Vercel frontend URL
];

// ✅ Configure CORS Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// ✅ Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("🚀 New client connected:", socket.id);

  // ✅ Handle Ride Requests
  socket.on("requestRide", (data) => {
    console.log("🛎️ New Ride Request:", data);
    io.emit("newRide", data); // Broadcast ride to all drivers
  });

  // ✅ Handle Ride Updates (e.g., accepted, completed)
  socket.on("updateRideStatus", (data) => {
    console.log("🔄 Ride Status Update:", data);
    io.emit("rideStatusUpdated", data); // Broadcast update to users
  });

  // ✅ Handle Client Disconnection
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
