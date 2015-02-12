var Caret = document.getElementById("Caret")
var codeEdit = document.getElementById("codeEdit")
var codeView = document.getElementById("codeView")
var editCaret = document.getElementById("editCaret")
var str = codeEdit.value.length
var carets = []
var sessionid = ""

document.getElementById("black_link").onclick = function() {
	document.getElementById("black_style").disabled = true
	document.getElementById("white_style").disabled = false
	document.body.className = "white"
	return false
}

document.getElementById("white_link").onclick = function() {
	document.getElementById("white_style").disabled = true
	document.getElementById("black_style").disabled = false
	document.body.className = "black"
	return false
}

var renderStr = function() {
	codeView.innerHTML = codeEdit.value.replace(/</g, "&#60;").replace(/>/g, "&#62;")
	codeView.className = "hljs"
	hljs.highlightBlock(codeView)
	codeEdit.style.height = codeView.offsetHeight + "px"
}

var renderCaret = function(id) {
	document.getElementById("editCaret-"+id).innerHTML = codeEdit.value.substring(0, carets[id].begin).replace(/</g, "&#60;").replace(/>/g, "&#62;")
	document.getElementById("Caret-"+id).innerHTML = codeEdit.value.substring(carets[id].begin, carets[id].end).replace(/</g, "&#60;").replace(/>/g, "&#62;")
}

var renderCarets = function() {
	for (var s in carets) {
		renderCaret(s)
	}
}

var handler = function() {

	if (str != codeEdit.value.length) {
		for (var s in carets) {
			if ((carets[sessionid].begin < carets[s].begin) && (codeEdit.selectionStart < carets[s].begin)) {
				carets[s].begin = carets[s].begin + codeEdit.value.length - str;
				if (carets[s].begin < carets[sessionid].begin)
					carets[s].begin = carets[sessionid].begin
				if (carets[s].begin > codeEdit.value.length)
					carets[s].begin = codeEdit.value.length
			}
		}
		for (var s in carets) {
			if ((carets[sessionid].end < carets[s].end) && (codeEdit.selectionStart < carets[s].end)) {
				carets[s].end = carets[s].end + codeEdit.value.length - str;
				if (carets[s].end < carets[sessionid].end)
					carets[s].end = carets[sessionid].end
				if (carets[s].end > codeEdit.value.length)
					carets[s].end = codeEdit.value.length
			}
		}
		str = codeEdit.value.length
		renderStr()
		renderCarets()
		socketCode.emit("message", {str: codeEdit.value, caret: carets[sessionid]})
	}

	if ((carets[sessionid].begin != codeEdit.selectionStart)||(carets[sessionid].end != codeEdit.selectionEnd)) {
		carets[sessionid].begin = codeEdit.selectionStart
		carets[sessionid].end = codeEdit.selectionEnd
		renderCaret(sessionid)
		socketCode.emit("position", {caret: carets[sessionid]} )
	}

}

var socketCode = io(window.location.href)

socketCode.on("connect", function() {

	sessionid = socketCode.json.id
	Caret.id = "Caret-"+sessionid
	editCaret.id = "editCaret-"+sessionid
	carets[sessionid] = {begin: 0, end: 0}
	setInterval(handler, 40)

	socketCode.on("message", function (data) {
		for (var s in carets) {
			if ((carets[sessionid].begin < carets[s].begin) && (codeEdit.selectionStart < carets[s].begin)) {
				carets[s].begin = carets[s].begin + codeEdit.value.length - str;
				if (carets[s].begin < carets[sessionid].begin)
					carets[s].begin = carets[sessionid].begin
				if (carets[s].begin > codeEdit.value.length)
					carets[s].begin = codeEdit.value.length
			}
		}
		for (var s in carets) {
			if ((carets[sessionid].end < carets[s].end) && (codeEdit.selectionStart < carets[s].end)) {
				carets[s].end = carets[s].end + codeEdit.value.length - str;
				if (carets[s].end < carets[sessionid].end)
					carets[s].end = carets[sessionid].end
				if (carets[s].end > codeEdit.value.length)
					carets[s].end = codeEdit.value.length
			}
		}
		codeEdit.value = data.str
		str = codeEdit.value.length
		codeEdit.selectionEnd = carets[sessionid].begin
		codeEdit.selectionStart = carets[sessionid].end
		renderStr()
		renderCarets()
	})

	socketCode.on("position", function (data) {
		carets[data.id] = data.caret
		renderCaret(data.id)
	})

	socketCode.on("join", function (data) {
		carets[data.id] = data.caret
		editCaret.parentNode.insertAdjacentHTML("afterEnd", "<pre class=\"codeCaret\"><span class=\"editCaret\" id=\"editCaret-"+data.id+"\"></span><span class=\"Caret Caret-"+Math.floor(Math.random()*5+1)+"\" id=\"Caret-"+data.id+"\"></span></pre>")
	})

	socketCode.on("leave", function (data) {
		delete carets[data.id]
		document.getElementById("editCaret-"+data.id).parentNode.parentNode.removeChild(document.getElementById("editCaret-"+data.id).parentNode)
	})

})

renderStr()