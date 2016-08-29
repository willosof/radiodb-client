var cmd = require('node-cmd');
var socket = require('socket.io-client')('http://radio.raider.no');
var ongoingEvent = 0;

socket.on('connect', function(){
	console.log("connected");
	socket.emit("busy",false);
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
					result: res
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

socket.on('disconnect', function(){
	console.log("disconnected");
});

