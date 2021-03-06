var cmd = require('node-cmd');
var socket = require('socket.io-client')('http://radio.raider.no');
var shortid = require('shortid');
var fs = require('fs');
var microtime = require('microtime');
var connected = false;
var killer;
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

// remove line breaks/feeds
myid = myid.replace(/(\r\n|\n|\r)/gm,"");

var ongoingEvent = 0;
var rebirth = require("rebirth");

socket.on('connect', function(){
	connected = true;
	console.log("connected");
	socket.emit("radionode");
	socket.emit("id",myid);
	socket.emit("busy",false);
});


console.log("myid",myid);
var doPong = function(){};

doPong = function() {
	if (connected == true) {
		socket.emit("alive",{
			mytime: microtime.nowDouble(),
			id: myid
		})
	}
	setTimeout(doPong,2000);
};


doPong();
var killProcess = function(killall,command) {
	console.log("KILLING PROCESS:",command);
	socket.emit("prockill",command);
	cmd.get( "killall -9 " + killall, function(res) {
		console.log("DONE KILLING");
	});
}
socket.on('command', function(data){
	if (ongoingEvent == 0) {
		socket.emit("busy",true);
		ongoingEvent = 1;
		console.log("recv command",data);

		if (killer) { clearTimeout(killer); }

		killer = setTimeout(function() {
			killProcess(data.killall, data.cmd);
		}, (data.killtime));

		cmd.get(
			data.cmd,
			function(res){
				console.log("command done");
				if (killer) { clearTimeout(killer); }
				socket.emit("command_result", {
					command: data.cmd,
					result: res,
					mytime: microtime.nowDouble(),
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
	connected = false;
	console.log("disconnected");
});
