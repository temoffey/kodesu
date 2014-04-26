var codeEdit = document.getElementById("codeEdit")
var codeView = document.getElementById("codeView")
var editCaret = document.getElementById("editCaret")
var str = codeEdit.value.length
var carets = []
var sessionid = ""

var renderStr = function() {
	codeView.innerHTML = codeEdit.value.replace(/</g, "&#60;").replace(/>/g, "&#62;")
	codeView.className = ""
	hljs.highlightBlock(codeView)
	codeEdit.style.width = codeView.offsetWidth + "px"
	codeEdit.style.height = codeView.offsetHeight + "px"
}

var renderCaret = function(id) {
	document.getElementById("editCaret-"+id).innerHTML = codeEdit.value.substring(0, carets[id].pos).replace(/</g, "&#60;").replace(/>/g, "&#62;")
}

var renderCarets = function() {
	for (var s in carets) {
		renderCaret(s)
	}
}

var handler = function() {

	if (str != codeEdit.value.length) {
		for (var s in carets) {
			if ((carets[sessionid].pos < carets[s].pos) && (codeEdit.selectionStart < carets[s].pos)) {
				carets[s].pos = carets[s].pos + codeEdit.value.length - str;
				if (carets[s].pos < carets[sessionid].pos)
					carets[s].pos = carets[sessionid].pos
				if (carets[s].pos > codeEdit.value.length)
					carets[s].pos = codeEdit.value.length
			}
		}
		str = codeEdit.value.length
		renderStr()
		renderCarets()
		socketCode.emit("message", {str: codeEdit.value, pos: carets[sessionid].pos})
	}

	if (carets[sessionid].pos != codeEdit.selectionStart) {
		carets[sessionid].pos = codeEdit.selectionStart
		renderCaret(sessionid)
		socketCode.emit("position", {pos: carets[sessionid].pos})
	}

}

var socketCode = io.connect("http://code.temoffey.ru:8040"+window.location.pathname)

socketCode.on("connect", function() {

	sessionid = socketCode.socket.sessionid
	editCaret.id = "editCaret-"+sessionid
	carets[sessionid] = {id: sessionid, pos: 0}
	setInterval(handler, 40)

	socketCode.on("message", function (data) {
		for (var s in carets) {
			if ((carets[data.id].pos < carets[s].pos) && (data.pos < carets[s].pos)) {
				carets[s].pos = carets[s].pos + data.str.length - str;
				if (carets[s].pos < data.pos)
					carets[s].pos = data.pos
				if (carets[s].pos > data.str.length)
					carets[s].pos = data.str.length
			}
		}
		codeEdit.value = data.str
		str = codeEdit.value.length
		codeEdit.selectionEnd = carets[sessionid].pos
		codeEdit.selectionStart = carets[sessionid].pos
		renderStr()
		renderCarets()
	})

	socketCode.on("position", function (data) {
		carets[data.id] = {id: data.id, pos: data.pos}
		renderCaret(data.id)
	})

	socketCode.on("join", function (data) {
		carets[data.id] = {id: data.id, pos: 0}
		editCaret.parentNode.insertAdjacentHTML("afterEnd", "<pre class=\"codeCaret\"><span class=\"editCaret\" id=\"editCaret-"+data.id+"\"></span><span class=\"Caret Caret-"+Math.floor(Math.random()*5+1)+"\"></span></pre>")
	})

	socketCode.on("leave", function (data) {
		delete carets[data.id]
		document.getElementById("editCaret-"+data.id).parentNode.parentNode.removeChild(document.getElementById("editCaret-"+data.id).parentNode)
	})

})

renderStr()