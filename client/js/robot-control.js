var _login, _idGame;
$().ready(function () {
    _login = document.getElementById('login').value;
    _idGame = document.getElementById('idGame').value;
});
function init(){
	socket = io.connect();
	console.log(_login);
	console.log(_idGame);
	socket.emit('identification', {
            login: _login,
            idGame: _idGame
        }
    );
    socket.on('ordreMobileServeur', function (data) {
        console.log("OrdreMobile are :\n" + JSON.stringify(data));
    });
}
$( document ).ready(function() {
    $( ".robotBlock img" ).on( "click", function() {
        socket.emit('ordreMobile',{
            login:_login,
            idGame:_idGame,
            action:"move",
            robot:$(this).attr("id")});
    });

	$( ".robotDirection img" ).on( "click", function() {
		if(socket!=null){
			socket.emit('ordreMobile',{
                login:_login,
                idGame:_idGame,
                action:"select",
                data:$(this).attr("id")
            })
		}
	});
});
/**
    objGeneralProposition = {
        "idGame": _idGame,
        "login": _login,
        "proposition": [
		    {
			    "command": "select",
		    	"robot": rouge
        	}
        ]
    };

    suitedeProposition = [{},{},proposition]

propositionSelection = {
    "command": "select",
    "robot": couleurRobot
}
propositionMove = {
    "command": "move",
    "line": this.pokBot.y + "",
    "column": this.pokBot.x + ""
}

**/
