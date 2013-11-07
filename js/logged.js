var XHR = function(method, ad, params) {
	var xhr = new XMLHttpRequest();
	xhr.onload = params.onload || null;
	xhr.open(method, ad);
	if(method == 'POST') {xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');}
	var variables   = params.variables || null
	  , str			= '';
	for(var i in variables) {
		 str += i + '=' + encodeURIComponent( variables[i] ) + '&';
		}
	xhr.send( str );
}

function createRobots(robotElements){
    $.each(robotElements,function(idRobot,robot){
        console.log(robot);
        $("#board tr:eq("+robot.line+") td:eq("+robot.column+")").addClass("robot"+robot.color);
            
    });
}

function createTarget(targetElement){
    $("#board tr:eq("+targetElement.l+") td:eq("+targetElement.c+")").addClass("cible"+targetElement.t);

}

function createBoard(boardElements){
    var _DOMBoard = $("#board");
    $.each(boardElements,function(idLigne,ligne){
        var _DOMLigne = $("<tr></tr>");
        $(_DOMBoard).append(_DOMLigne);
        $.each(ligne,function(idLigne,cell){
            var _DOMCase = $("<td></td>");
            $.each(cell, function(NameClass, value) {
                $(_DOMCase).addClass(NameClass);
            });
            $(_DOMLigne).append(_DOMCase);
        });
    });
}

function displayGrid(){
    $.getJSON( "/"+document.getElementById('idGame').value, function( grille ) {
         console.log(grille.robots);
         createBoard(grille.board);
         createTarget(grille.target);
         createRobots(grille.robots);
    });
}

console.log("test");

function init() {
	// Connect to the SocketIO server to retrieve ongoing games.
	socket = io.connect();
	socket.on('participants', function(data) {
		 var ul = document.getElementById('lesParticipants');
		 ul.innerHTML='';
		 for(p in data.participants) {
			 var li = document.createElement('li'); 
			 ul.appendChild( li );
			 li.appendChild( document.createTextNode( data.participants[p] ) );
			}
		});
	socket.on('FinalCountDown'	, function(data) {
		 var ms   = data.FinalCountDown;
		 console.log("FinalCountDown : " + ms);
		});
	socket.on('TerminateGame'	, function(data) {
		 h1 = document.querySelector('body > header > h1');
		 h1.innerHTML += ' est terminée !';
		});
	socket.on('solutions'		, function(data) {
		 console.log("Solutions are :\n"+JSON.stringify(data.solutions));
		});
	socket.emit ('identification', 	{ login	: document.getElementById('login').value
									, idGame: document.getElementById('idGame').value}
				);
				
	displayGrid();
}
