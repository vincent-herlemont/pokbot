var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(80);

function handler (req, res) {
  fs.readFile(__dirname + '/client.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
var dataGlobale = "V1";

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });

  socket.on('f2', function (data) {
  	dataGlobale = data;
  });

  socket.on('f1', function (data) {
	  setInterval(function(){
	  	console.log(dataGlobale);
		  (function(_i){
		    setInterval(function(){
		  		console.log("_i = "+_i);
		  	},1000);
		  })(dataGlobale)
	  },5000);

  });


});