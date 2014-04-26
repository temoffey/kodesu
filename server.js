var express = require("express"),
	app = express(),
	http = require("http"),
	server = http.createServer(app),
	io = require("socket.io").listen(server)

var rooms = []

server.listen(8040)

app.use(express.static(__dirname + "/"))

app.set("views", __dirname + "/")

app.engine("ejs", require("ejs").renderFile)

app.get("/:id?", function (req, res, next) {

	if (req.params.id && rooms[req.params.id]) {

		res.render("index.ejs", {code: rooms[req.params.id].str, carets: rooms[req.params.id].carets})

	} else {

		if (!req.params.id) {

			req.params.id = Math.random().toString(36).substring(2, 9)

			while (rooms[req.params.id]) {
				req.params.id = Math.random().toString(36).substring(2, 9)
			}

		}

		res.redirect('/'+req.params.id)

		rooms[req.params.id] = {str: "", carets: [], socket: {}}

		rooms[req.params.id].io = io.of("/"+req.params.id).on("connection", function (socket) {

			rooms[req.params.id].carets[socket.id] = {id: socket.id, pos: 0}
			socket.broadcast.emit("join", {id: socket.id})

			socket.on("message", function (data) {
				rooms[req.params.id].str = data.str
				data.id = socket.id
				rooms[req.params.id].carets[socket.id].pos = data.pos
				socket.broadcast.emit("message", data)
			})

			socket.on("position", function (data) {
				rooms[req.params.id].carets[socket.id].pos = data.pos
				data.id = socket.id
				socket.broadcast.emit("position", data)
			})

			socket.on("disconnect", function () {
				delete rooms[req.params.id].carets[socket.id]
				if (rooms[req.params.id].carets.length == 0) {
					delete rooms[req.params.id].io
				} else {
					socket.broadcast.emit("leave", {id: socket.id})
				}
			})

		})

	}

});

io.set("log level", 1)