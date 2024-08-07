const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = createServer(app);
const io = new Server(server);
const players = [];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
	res.render("index");
});

io.on("connection", (socket) => {
	console.log("a user connected");

	socket.on("finish game", (data) => {
		console.log("finish game", data);
		socket.broadcast.emit("game finished", data);
	})

	socket.on("start game", (data) => {
		data.push(players);
		socket.broadcast.emit("game started", data);
		socket.emit("start game", data);
	});

	socket.on("set turns", (data) => {
		console.log("set turns", data);
		socket.broadcast.emit("turns set", data);
	})

	socket.on("join", (data) => {
		players.push(data);
		socket.broadcast.emit("joined", data);
		socket.emit("join", data);
	});
	
	socket.on("set order", (data) => {
		console.log("set order", data);
		socket.broadcast.emit("order set", data);
	});

	socket.on("flip card", (data) => {
		console.log("flip card", data);
		socket.broadcast.emit("card flipped", data);
	});

	socket.on("unflip cards", (data) => {
		console.log("unflip cards", data);
		socket.broadcast.emit("cards unflipped", data);
	});

	socket.on("find match", (data) => {
		console.log("find match", data);
		socket.broadcast.emit("match found", data);
	});

	socket.on("disconnect", () => {
		console.log("user disconnected");
	});
});

server.listen(3000, () => {
	console.log("server running at http://localhost:3000");
});

module.exports = {players};