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
}
$( document ).ready(function() {
	$( ".robotDirection img" ).on( "click", function() {
		if(socket!=null){
			socket.emit('message',{data:$(this).attr("id")})
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