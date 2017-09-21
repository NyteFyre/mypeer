

//webrtc.js:  This is where we will put the bulk of the webrtc related code

//Blob
(function (view) {
	
	view.URL = view.URL || view.webkitURL;

	if (view.Blob && view.URL) {
		try {
			new Blob;
			return;
		} catch (e) {}
	}

	// Internally we use a BlobBuilder implementation to base Blob off of
	// in order to support older browsers that only have BlobBuilder
	var BlobBuilder = view.BlobBuilder || view.WebKitBlobBuilder || view.MozBlobBuilder || (function(view) {
		var
			  get_class = function(object) {
				return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
			}
			, FakeBlobBuilder = function BlobBuilder() {
				this.data = [];
			}
			, FakeBlob = function Blob(data, type, encoding) {
				this.data = data;
				this.size = data.length;
				this.type = type;
				this.encoding = encoding;
			}
			, FBB_proto = FakeBlobBuilder.prototype
			, FB_proto = FakeBlob.prototype
			, FileReaderSync = view.FileReaderSync
			, FileException = function(type) {
				this.code = this[this.name = type];
			}
			, file_ex_codes = (
				  "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR "
				+ "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
			).split(" ")
			, file_ex_code = file_ex_codes.length
			, real_URL = view.URL || view.webkitURL || view
			, real_create_object_URL = real_URL.createObjectURL
			, real_revoke_object_URL = real_URL.revokeObjectURL
			, URL = real_URL
			, btoa = view.btoa
			, atob = view.atob

			, ArrayBuffer = view.ArrayBuffer
			, Uint8Array = view.Uint8Array

			, origin = /^[\w-]+:\/*\[?[\w\.:-]+\]?(?::[0-9]+)?/
		;
		FakeBlob.fake = FB_proto.fake = true;
		while (file_ex_code--) {
			FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
		}
		// Polyfill URL
		if (!real_URL.createObjectURL) {
			URL = view.URL = function(uri) {
				var
					  uri_info = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
					, uri_origin
				;
				uri_info.href = uri;
				if (!("origin" in uri_info)) {
					if (uri_info.protocol.toLowerCase() === "data:") {
						uri_info.origin = null;
					} else {
						uri_origin = uri.match(origin);
						uri_info.origin = uri_origin && uri_origin[1];
					}
				}
				return uri_info;
			};
		}
		URL.createObjectURL = function(blob) {
			var
				  type = blob.type
				, data_URI_header
			;
			if (type === null) {
				type = "application/octet-stream";
			}
			if (blob instanceof FakeBlob) {
				data_URI_header = "data:" + type;
				if (blob.encoding === "base64") {
					return data_URI_header + ";base64," + blob.data;
				} else if (blob.encoding === "URI") {
					return data_URI_header + "," + decodeURIComponent(blob.data);
				} if (btoa) {
					return data_URI_header + ";base64," + btoa(blob.data);
				} else {
					return data_URI_header + "," + encodeURIComponent(blob.data);
				}
			} else if (real_create_object_URL) {
				return real_create_object_URL.call(real_URL, blob);
			}
		};
		URL.revokeObjectURL = function(object_URL) {
			if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
				real_revoke_object_URL.call(real_URL, object_URL);
			}
		};
		FBB_proto.append = function(data/*, endings*/) {
			var bb = this.data;
			// decode data to a binary string
			if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
				var
					  str = ""
					, buf = new Uint8Array(data)
					, i = 0
					, buf_len = buf.length
				;
				for (; i < buf_len; i++) {
					str += String.fromCharCode(buf[i]);
				}
				bb.push(str);
			} else if (get_class(data) === "Blob" || get_class(data) === "File") {
				if (FileReaderSync) {
					var fr = new FileReaderSync;
					bb.push(fr.readAsBinaryString(data));
				} else {
					// async FileReader won't work as BlobBuilder is sync
					throw new FileException("NOT_READABLE_ERR");
				}
			} else if (data instanceof FakeBlob) {
				if (data.encoding === "base64" && atob) {
					bb.push(atob(data.data));
				} else if (data.encoding === "URI") {
					bb.push(decodeURIComponent(data.data));
				} else if (data.encoding === "raw") {
					bb.push(data.data);
				}
			} else {
				if (typeof data !== "string") {
					data += ""; // convert unsupported types to strings
				}
				// decode UTF-16 to binary string
				bb.push(unescape(encodeURIComponent(data)));
			}
		};
		FBB_proto.getBlob = function(type) {
			if (!arguments.length) {
				type = null;
			}
			return new FakeBlob(this.data.join(""), type, "raw");
		};
		FBB_proto.toString = function() {
			return "[object BlobBuilder]";
		};
		FB_proto.slice = function(start, end, type) {
			var args = arguments.length;
			if (args < 3) {
				type = null;
			}
			return new FakeBlob(
				  this.data.slice(start, args > 1 ? end : this.data.length)
				, type
				, this.encoding
			);
		};
		FB_proto.toString = function() {
			return "[object Blob]";
		};
		FB_proto.close = function() {
			this.size = 0;
			delete this.data;
		};
		return FakeBlobBuilder;
	}(view));

	view.Blob = function(blobParts, options) {
		var type = options ? (options.type || "") : "";
		var builder = new BlobBuilder();
		if (blobParts) {
			for (var i = 0, len = blobParts.length; i < len; i++) {
				if (Uint8Array && blobParts[i] instanceof Uint8Array) {
					builder.append(blobParts[i].buffer);
				}
				else {
					builder.append(blobParts[i]);
				}
			}
		}
		var blob = builder.getBlob(type);
		if (!blob.slice && blob.webkitSlice) {
			blob.slice = blob.webkitSlice;
		}
		return blob;
	};

	var getPrototypeOf = Object.getPrototypeOf || function(object) {
		return object.__proto__;
	};
	view.Blob.prototype = getPrototypeOf(new view.Blob());
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content || this));

////////SIGNALING CODE/////////////
io = io.connect();
var myName = "";
var theirName = "";
var myUserType = "";
var configuration = {
	'iceServers': [{
		'url': 'stun:stun.l.google.com:19302'
	}]
};
var rtcPeerConn;
var mainVideoArea = document.querySelector("#mainVideoTag");
var smallVideoArea = document.querySelector("#smallVideoTag");
var dataChannelOptions = {
	ordered: false, //no guaranteed delivery, unreliable but faster 
	maxRetransmitTime: 1000, //milliseconds
};
var dataChannel;

io.on('signal', function(data) {
	if (data.user_type == "expert" && data.command == "joinroom") {
		console.log("The expert is here!");
		if (myUserType == "student") {
			theirName = data.user_name;
			document.querySelector("#messageOutName").textContent = theirName;
			document.querySelector("#messageInName").textContent = myName;
		}
		//Switch to the expert listing
		document.querySelector("#requestExpertForm").style.display = 'none';
		document.querySelector("#waitingForExpert").style.display = 'none';
		document.querySelector("#expertListing").style.display = 'block';
	}
	else if (data.user_type == "student" && data.command == "callexpert") {
		console.log("Student is calling");
		if (!rtcPeerConn) startSignaling();
		if (myUserType == "expert") {
			theirName = data.user_name;
			document.querySelector("#messageOutName").textContent = theirName;
			document.querySelector("#messageInName").textContent = myName;
		}
		document.querySelector("#expertSignup").style.display = 'none';
		document.querySelector("#videoPage").style.display = 'block';
	}
	else if (data.user_type == 'signaling') {
		if (!rtcPeerConn) startSignaling();
		var message = JSON.parse(data.user_data);
		if (message.sdp) {
			rtcPeerConn.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
				// if we received an offer, we need to answer
				if (rtcPeerConn.remoteDescription.type == 'offer' && myUserType == "expert") {
					rtcPeerConn.createAnswer(sendLocalDesc, logError);
				}
			}, logError);
		}
		else {
			rtcPeerConn.addIceCandidate(new RTCIceCandidate(message.candidate));
		}
	}
}); 

function startSignaling() {
	console.log("starting signaling...");
	rtcPeerConn = new webkitRTCPeerConnection(configuration);
	dataChannel = rtcPeerConn.createDataChannel('textMessages', dataChannelOptions);
				
	dataChannel.onopen = dataChannelStateChanged;
	rtcPeerConn.ondatachannel = receiveDataChannel;
	
	// send any ice candidates to the other peer
	rtcPeerConn.onicecandidate = function (evt) {
		if (evt.candidate)
			io.emit('signal',{"user_type":"signaling", "command":"icecandidate", "user_data": JSON.stringify({ 'candidate': evt.candidate })});
		console.log("completed sending an ice candidate...");
	};
	
	// let the 'negotiationneeded' event trigger offer generation
	rtcPeerConn.onnegotiationneeded = function () {
		console.log("on negotiation called");
		if (myUserType == "student") {
			rtcPeerConn.createOffer(sendLocalDesc, logError);
		}
	};
	
	// once remote stream arrives, show it in the main video element
	rtcPeerConn.onaddstream = function (evt) {
		console.log("going to add their stream...");
		mainVideoArea.src = URL.createObjectURL(evt.stream);
	};
	
	// get a local stream, show it in our video tag and add it to be sent
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	navigator.getUserMedia({
		'audio': true,
		'video': true
	}, function (stream) {
		console.log("going to display my stream...");
		smallVideoArea.src = URL.createObjectURL(stream);
		rtcPeerConn.addStream(stream);
	}, logError);
			  
}

function sendLocalDesc(desc) {
	rtcPeerConn.setLocalDescription(desc, function () {
		console.log("sending local description");
		io.emit('signal',{"user_type":"signaling", "command":"SDP", "user_data": JSON.stringify({ 'sdp': rtcPeerConn.localDescription })});
	}, logError);
}
			
function logError(error) {
}

//////////MUTE/PAUSE STREAMS CODE////////////
var muteMyself = document.querySelector("#muteMyself");
var pauseMyVideo = document.querySelector("#pauseMyVideo");

muteMyself.addEventListener('click', function(ev){
	console.log("muting/unmuting myself");
	var streams = rtcPeerConn.getLocalStreams();
	for (var stream of streams) {
		for (var audioTrack of stream.getAudioTracks()) {
			if (audioTrack.enabled) { muteMyself.innerHTML = "Unmute" }
			else { muteMyself.innerHTML = "Mute Myself" }
			audioTrack.enabled = !audioTrack.enabled;
		}
		console.log("Local stream: " + stream.id);
	}
	ev.preventDefault();
}, false);

pauseMyVideo.addEventListener('click', function(ev){
	console.log("pausing/unpausing my video");
	var streams = rtcPeerConn.getLocalStreams();
	for (var stream of streams) {
		for (var videoTrack of stream.getVideoTracks()) {
			if (videoTrack.enabled) { pauseMyVideo.innerHTML = "Start Video" }
			else { pauseMyVideo.innerHTML = "Pause Video" }
			videoTrack.enabled = !videoTrack.enabled;
		}
		console.log("Local stream: " + stream.id);
	}
	ev.preventDefault();
}, false);

/////////////Data Channels Code///////////
var messageHolder = document.querySelector("#messageHolder");
var myMessage = document.querySelector("#myMessage");
var sendMessage = document.querySelector("#sendMessage");
var receivedFileName;
var receivedFileSize;
var fileBuffer = [];
var fileSize = 0;
var fileTransferring = false;

function dataChannelStateChanged() {
	if (dataChannel.readyState === 'open') {
		console.log("Data Channel open");
		dataChannel.onmessage = receiveDataChannelMessage;
	}
}

function receiveDataChannel(event) {
	console.log("Receiving a data channel");
	dataChannel = event.channel;
	dataChannel.onmessage = receiveDataChannelMessage;
}

function receiveDataChannelMessage(event) {
	console.log("From DataChannel: " + event.data);
	if (fileTransferring) {
		//Now here is the file handling code:
		fileBuffer.push(event.data);
		fileSize += event.data.byteLength;
		fileProgress.value = fileSize;
				
		//Provide link to downloadable file when complete
		if (fileSize === receivedFileSize) {
			var received = new window.Blob(fileBuffer);
			fileBuffer = [];

			downloadLink.href = URL.createObjectURL(received);
			downloadLink.download = receivedFileName;
			downloadLink.appendChild(document.createTextNode(receivedFileName + "(" + fileSize + ") bytes"));
			fileTransferring = false;
			
			//Also put the file in the text chat area
			var linkTag = document.createElement('a');
			linkTag.href = URL.createObjectURL(received);
			linkTag.download = receivedFileName;
			linkTag.appendChild(document.createTextNode(receivedFileName));
			var div = document.createElement('div');
			div.className = 'message-out';
			div.appendChild(linkTag);
			messageHolder.appendChild(div);
		}
	}
	else {
		appendChatMessage(event.data, 'message-out');
	}
}


sendMessage.addEventListener('click', function(ev){
	dataChannel.send(myMessage.value);
	appendChatMessage(myMessage.value, 'message-in');
	myMessage.value = "";
	ev.preventDefault();
}, false);

function appendChatMessage(msg, className) {
	var div = document.createElement('div');
	div.className = className;
	div.innerHTML = '<span>' + msg + '</span>';
	messageHolder.appendChild(div);
}

/////////////File Transfer///////////
var sendFile = document.querySelector("input#sendFile");
var fileProgress = document.querySelector("progress#fileProgress");
var downloadLink = document.querySelector('a#receivedFileLink');

io.on('files', function(data) {
	receivedFileName = data.filename;
	receivedFileSize = data.filesize;
	console.log("File on it's way is " + receivedFileName + " (" + receivedFileSize + ")");
	fileTransferring = true;
});

sendFile.addEventListener('change', function(ev){
	var file = sendFile.files[0];
	console.log("sending file " + file.name + " (" + file.size + ") ...");
	io.emit('files',{"filename":file.name, "filesize":file.size});
	appendChatMessage("sending " + file.name, 'message-in');
	fileTransferring = true;
						
	fileProgress.max = file.size;
	var chunkSize = 16384;
	var sliceFile = function(offset) {
		var reader = new window.FileReader();
		reader.onload = (function() {
			return function(e) {
				dataChannel.send(e.target.result);
				if (file.size > offset + e.target.result.byteLength) {
					window.setTimeout(sliceFile, 0, offset + chunkSize);
				}
				fileProgress.value = offset + e.target.result.byteLength;
			};
		})(file);
		var slice = file.slice(offset, offset + chunkSize);
		reader.readAsArrayBuffer(slice);
	};
	sliceFile(0);
	fileTransferring = false;
}, false);

/////////////Share My Screen///////////
var shareMyScreen = document.querySelector("#shareMyScreen");
shareMyScreen.addEventListener('click', function(ev){
	shareScreenText = "Share Screen";
	stopShareScreenText = "Stop Sharing";
	console.log("Screen share button text: " + shareMyScreen.innerHTML)
	if (shareMyScreen.innerHTML == shareScreenText) {
		var msg = "Sharing my screen...";
		appendChatMessage(msg, 'message-in');
		
		getScreenMedia(function (err, stream) {
			if (err) {
				console.log('failed: ' + err);
			} else {
				console.log('got a stream', stream);
				smallVideoTag.src = URL.createObjectURL(stream);
				rtcPeerConn.addStream(stream);
			}
		});
		
		shareMyScreen.innerHTML = stopShareScreenText;
	}
	else {
		console.log("Resetting my stream to video...");
		
		//get a local stream again to replace the screen sharing
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	navigator.getUserMedia({
		'audio': true,
		'video': true
	}, function (stream) {
		console.log("going to display my stream...");
		smallVideoArea.src = URL.createObjectURL(stream);
		rtcPeerConn.addStream(stream);
	}, logError);
	
	shareMyScreen.innerHTML = shareScreenText;
	}
	
	ev.preventDefault();
}, false);

