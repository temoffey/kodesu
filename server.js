var express = require("express"),
	app = express(),
	http = require("http"),
	server = http.createServer(app),
	io = require("socket.io").listen(server),
	config = require('./config'),
	mysql = require('mysql'),
	connection = mysql.createConnection(config.db)

var createRoom = function(id) {

	rooms[id] = {str: "", carets: []}

	rooms[id].io = io.of("/"+id).on("connection", function (socket) {

		rooms[id].carets[socket.id] = {id: socket.id, begin: 0, end: 0}
		socket.broadcast.emit("join", {id: socket.id, caret: rooms[id].carets[socket.id]})

		socket.on("message", function (data) {
			rooms[id].str = data.str
			rooms[id].carets[socket.id] = data.caret
			data.id = socket.id
			connection.query("UPDATE rooms SET str=? WHERE id=?", [rooms[id].str, id])
			socket.broadcast.emit("message", data)
		})

		socket.on("update", function (data) {
			rooms[id].str = rooms[id].str.substring(0, data.caret.begin) + data.str + rooms[id].str.substring(data.caret.end, rooms[id].str.length)
			rooms[id].carets[socket.id] = data.caret.begin
			if (data.str) rooms[id].carets[socket.id] += data.str.length
			data.id = socket.id
			connection.query("UPDATE rooms SET str=? WHERE id=?", [rooms[id].str, id])
			socket.broadcast.emit("update", data)
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

var rooms = []

connection.query("SELECT * FROM rooms", function(err, rows, fields) {
	for (var i in rows) {
		createRoom(rows[i].id)
		rooms[rows[i].id].str = rows[i].str
	}
})

server.listen(config.web.port)

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
					connection.query("INSERT INTO rooms VALUES (?, ?)", [id, rooms[id].str])

				}
				if (req.params.method == "close") {

					res.redirect('/about')
					setTimeout(function() { delete rooms[req.params.id] }, 2000)			// Fix this, create method "close"
					//connection.query("DELETE FROM rooms WHERE id=?", [req.params.id])		// Wait method "close"

				}
			} else {

				res.render("index.ejs", {id: req.params.id, code: rooms[req.params.id].str, carets: rooms[req.params.id].carets})

			}
		} else {

			createRoom(req.params.id)
			connection.query("INSERT INTO rooms VALUES (?, ?)", [req.params.id, rooms[req.params.id].str])
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