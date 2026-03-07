import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import paymentroutes from "./routes/payment.js";
import downloadroutes from "./routes/download.js";

const app = express();

// ✅ ALLOWED ORIGINS
const allowedOrigins = [
    "http://localhost:3000",
    "https://elevance-1.vercel.app"
];

// ✅ ROBUST CORS CONFIGURATION


app.use(
    cors({
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// FIXED LINE
app.options("/*", cors());

// ✅ SECURITY HEADERS (Fix COOP Issue)
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
});

// ✅ STRIPE WEBHOOK HANDLING
app.use((req, res, next) => {
    if (req.originalUrl === "/api/payment/webhook") {
        next();
    } else {
        express.json({ limit: "30mb" })(req, res, next);
    }
});

// ✅ URL ENCODED DATA
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// ✅ TEST ROUTE
app.get("/", (req, res) => {
    res.send("YouTube backend is working correctly 🚀");
});

// ✅ ROUTES
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/uploads", express.static("uploads"));
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyroutes);
app.use("/comment", commentroutes);
app.use("/api/payment", paymentroutes);
app.use("/download", downloadroutes);

// ✅ CREATE HTTP SERVER
const httpServer = http.createServer(app);

// ✅ SOCKET.IO WITH CORS
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ✅ SOCKET USER MAP
const socketUsers = new Map();

// ✅ SOCKET CONNECTION
io.on("connection", (socket) => {

    socket.on("register", (userId) => {
        socketUsers.set(userId, socket.id);
        socket.userId = userId;
    });

    socket.on("call-user", ({ userToCall, signalData, from, fromName }) => {
        const targetSocketId = socketUsers.get(userToCall);
        if (targetSocketId) {
            io.to(targetSocketId).emit("incoming-call", {
                signal: signalData,
                from,
                fromName
            });
        }
    });

    socket.on("accept-call", ({ signal, to }) => {
        const targetSocketId = socketUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit("call-accepted", signal);
        }
    });

    socket.on("reject-call", ({ to }) => {
        const targetSocketId = socketUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit("call-rejected");
        }
    });

    socket.on("end-call", ({ to }) => {
        const targetSocketId = socketUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit("call-ended");
        }
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
        const targetSocketId = socketUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit("ice-candidate", candidate);
        }
    });

    socket.on("disconnect", () => {
        if (socket.userId) {
            socketUsers.delete(socket.userId);
        }
    });

});

// ✅ SERVER START
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server and Signaling running on port ${PORT} 🚀`);
});

// ✅ DATABASE CONNECTION
const DBURL = process.env.DB_URL;

mongoose
    .connect(DBURL)
    .then(() => {
        console.log("MongoDB connected ✅");
    })
    .catch((error) => {
        console.log("MongoDB connection error ❌:", error);
    });

console.log("Server setup complete, ready for connections.");