const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
  console.log("🚀 New client connected:", socket.id);

  socket.on("requestRide", (data) => {
    console.log("🛎️ Ride Request:", data);
    io.emit("newRide", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("🔥 Server running on port 5000");
});
