var cmd = require('node-cmd');
var socket = require('socket.io-client')('http://radio.raider.no');
var shortid = require('shortid');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

var ongoingEvent = 0;
var rebirth = require("rebirth");
var myid = shortid.generate();

socket.on('connect', function(){
	console.log("connected");
	socket.emit("busy",false);
	socket.emit("id",myid);
});


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
	if (ongoingEvent == 0) {
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

	} else {
		socket.emit("error","node busy");
		socket.emit("busy",true);
	}
});


socket.on('disconnect', function(){
	console.log("disconnected");
});
