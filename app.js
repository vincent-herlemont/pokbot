var s = require("./server/ServeurRasendeRoboter");
var port = process.env.PORT || 8090;
console.log("Listening on port " + port);
s.server.init(port);
