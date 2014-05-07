var express = require("express"),
	app = express(),
	http = require("http"),
	server = http.createServer(app),
	io = require("socket.io").listen(server)

var rooms = []

server.listen(8040)

var createRoom = function(id) {

	rooms[id] = {str: "", carets: []}

	rooms[id].io = io.of("/"+id).on("connection", function (socket) {

		rooms[id].carets[socket.id] = {id: socket.id, begin: 0, end: 0}
		socket.broadcast.emit("join", {id: socket.id, caret: rooms[id].carets[socket.id]})

		socket.on("message", function (data) {
			rooms[id].str = data.str
			rooms[id].carets[socket.id] = data.caret
			data.id = socket.id
			socket.broadcast.emit("message", data)
		})

		socket.on("position", function (data) {
			rooms[id].carets[socket.id] = data.caret
			data.id = socket.id
			socket.broadcast.emit("position", data)
		})

		socket.on("disconnect", function () {
			delete rooms[id].carets[socket.id]
			if (!Object.keys(rooms[id].carets).length) {
				delete rooms[id].io
			} else {
				socket.broadcast.emit("leave", {id: socket.id})
			}
		})

	})

}

app.use(express.static(__dirname + "/"))

app.set("views", __dirname + "/")

app.engine("ejs", require("ejs").renderFile)

app.get("/:id?/:method?", function (req, res, next) {

	if (req.params.id) {
		if (rooms[req.params.id]) {
			if (req.params.method) {
				if (req.params.method == "fork") {

					id = Math.random().toString(36).substring(2, 9)
					while (rooms[id]) {
						id = Math.random().toString(36).substring(2, 9)
					}
					res.redirect('/'+id)
					createRoom(id)
					rooms[id].str = rooms[req.params.id].str

				}
				if (req.params.method == "close") {

					res.redirect('/about')
					setTimeout(function() { delete rooms[req.params.id] }, 2000)		// Fix this, create method "leave"

				}
			} else {

				res.render("index.ejs", {id: req.params.id, code: rooms[req.params.id].str, carets: rooms[req.params.id].carets})

			}
		} else {

			createRoom(req.params.id)
			res.render("index.ejs", {id: req.params.id, code: rooms[req.params.id].str, carets: rooms[req.params.id].carets})

		}

	} else {

		id = Math.random().toString(36).substring(2, 9)
		while (rooms[id]) {
			id = Math.random().toString(36).substring(2, 9)
		}
		res.redirect('/'+id)
		createRoom(id)

	}

})

io.set("log level", 1)