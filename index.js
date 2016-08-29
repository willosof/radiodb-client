var cmd = require('node-cmd');
var socket = require('socket.io-client')('http://radio.raider.no');
var shortid = require('shortid');
var fs = require('fs');

var myid = shortid.generate();
var read_id;

try {
	read_id = fs.readFileSync('.id').toString();
	if (read_id && read_id.length > 4) {
		myid = read_id;
	}
} catch(e) {
	fs.writeFileSync('.id', myid);
}

var ongoingEvent = 0;
var rebirth = require("rebirth");

socket.on('connect', function(){
	console.log("connected");
	socket.emit("id",myid);
	socket.emit("busy",false);
});

console.log("myid",myid);

socket.on('command', function(data){
	if (ongoingEvent == 0) {
		socket.emit("busy",true);
		ongoingEvent = 1;
		console.log("recv command",data);
		cmd.get(
			data.cmd,
			function(res){
				console.log("command done");

				socket.emit("command_result", {
					command: data.cmd,
					result: res,
					cid: data.cid
				});

				console.log("data sent");
				ongoingEvent = 0;
				socket.emit("busy",false);
			}
		);

	} else {
		socket.emit("error","node busy");
		socket.emit("busy",true);
	}
});

socket.on('update', function(data){
	socket.emit("busy",true);
	ongoingEvent = 1;
	console.log("recv update",data);
	cmd.get(
		"git pull origin master",
		function(res){
			console.log("update done - rebirth()");
			rebirth();
		}
	);
});


socket.on('disconnect', function(){
	console.log("disconnected");
});
