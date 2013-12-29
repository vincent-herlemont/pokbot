function init() {
	// Connect to the SocketIO server to retrieve ongoing games.
	socket = io.connect();
	socket.on('gamesList', function(data) {
		 var ul = document.getElementById('lesParties');
		 ul.innerHTML='';
		 for(p in data.gamesList) {
			 var li = document.createElement('li'); 
			 ul.appendChild( li );
			 $(li).append('<span class="name">'+ data.gamesList[p] + '</span>' );
			 $(li).append('<span class="subText"> rejoindre </span> ');
			}
		}
	);
	socket.emit('loginPage');
	  	$("#lesParties").on("click", "li", function(){
	  $("#idGame").val($(this).children('.name').text());
	   $( "#nouvellePartie" ).submit();
	});
}
