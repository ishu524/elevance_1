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


// ✅ FIXED CORS
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://elevance-1.vercel.app"
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    })
);


// BODY PARSER
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));


// TEST ROUTE
app.get("/", (req, res) => {
    res.send("Youtube backend is working 🚀");
});


// ROUTES
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/uploads", express.static("uploads"));
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyroutes);
app.use("/comment", commentroutes);
app.use("/api/payment", paymentroutes);
app.use("/download", downloadroutes);


// CREATE HTTP SERVER
const httpServer = http.createServer(app);


// SOCKET.IO SERVER
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://elevance-1.vercel.app"
        ],
        methods: ["GET", "POST"]
    }
});


// STORE ONLINE USERS
const socketUsers = new Map();

io.on("connection", (socket) => {

    socket.on("register", (userId) => {
        socketUsers.set(userId, socket.id);
        socket.userId = userId;
    });

    socket.on("call-user", ({ userToCall, signalData, from, fromName }) => {
        const targetSocket = socketUsers.get(userToCall);

        if (targetSocket) {
            io.to(targetSocket).emit("incoming-call", {
                signal: signalData,
                from,
                fromName
            });
        }
    });

    socket.on("accept-call", ({ signal, to }) => {
        const targetSocket = socketUsers.get(to);

        if (targetSocket) {
            io.to(targetSocket).emit("call-accepted", signal);
        }
    });

    socket.on("reject-call", ({ to }) => {
        const targetSocket = socketUsers.get(to);

        if (targetSocket) {
            io.to(targetSocket).emit("call-rejected");
        }
    });

    socket.on("end-call", ({ to }) => {
        const targetSocket = socketUsers.get(to);

        if (targetSocket) {
            io.to(targetSocket).emit("call-ended");
        }
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
        const targetSocket = socketUsers.get(to);

        if (targetSocket) {
            io.to(targetSocket).emit("ice-candidate", candidate);
        }
    });

    socket.on("disconnect", () => {
        if (socket.userId) {
            socketUsers.delete(socket.userId);
        }
    });

});


// SERVER START
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});


// DATABASE CONNECTION
const DBURL = process.env.DB_URL;

mongoose
    .connect(DBURL)
    .then(() => {
        console.log("MongoDB connected ✅");
    })
    .catch((err) => {
        console.log("MongoDB error ❌", err);
    });

console.log("Server setup complete.");