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

function oRBoard(width,height){
    var _this = this;
    var paper = new Raphael(document.getElementById('partieRaphael'), width, height);
    //DoubleTab : [ligne][colum]
    this.stCell = [];
    //matrice*DoubleTab : [ligne][colum]{"g,b,h,d"}
    this.stWall = [];
    //ObjetPaper
    this.SetstWall = paper.set();
    
    this.cellSize = {};
    this.traceWall = function(pathPaper){
        var paperElement = paper.path(pathPaper);
        paperElement.attr({"stroke-width":2});
        return paperElement;
    }
    
    this.createBoard = function(boardElements){
        console.log(boardElements);
        _this.cellSize.width = (width/boardElements.length);
        var idLineInCourt = 0;
        var i_SetstWall = 0;
        $.each(boardElements,function(idLigne,ligne){
            _this.cellSize.height = (width/ligne.length);
            idLineInCourt = idLigne;
            _this.stCell[idLigne] = [];
            _this.stWall[idLigne] = [];
            $.each(ligne,function(idCell,cell){
                var i = 0
                var u = (i/ligne.length);
                _this.stCell[idLigne][idCell] = paper.rect(  
                ((_this.cellSize.width))*idCell,
                ((_this.cellSize.width))*idLineInCourt,
                (_this.cellSize.width-i),
                (_this.cellSize.width-i));
                _this.stWall[idLigne][idCell] = {};
                $.each(cell, function(NameClass, value) {
                    var x = _this.stCell[idLigne][idCell].attr("x");
                    var y = _this.stCell[idLigne][idCell].attr("y");
                    var width = _this.stCell[idLigne][idCell].attr("width");
                    var height = _this.stCell[idLigne][idCell].attr("height");
                    var pathPaper = "";
                    if(value==1){
                        if(NameClass=="g"){
                            pathPaper = "M"+(x+1)+" "+(y-i)+"L"+(x+1)+" "+(y+height+i)+"";
                            _this.SetstWall.push(_this.traceWall(pathPaper));
                            _this.stWall[idLigne][idCell].g = _this.SetstWall[i_SetstWall];
                            i_SetstWall++;
                        }else if(NameClass=="b"){
                            pathPaper = "M"+(x-i)+" "+(y+height-1)+"L"+(x+width+i)+" "+(y+height-1)+"";
                            _this.SetstWall.push(_this.traceWall(pathPaper));
                            _this.stWall[idLigne][idCell].b = _this.SetstWall[i_SetstWall];
                            i_SetstWall++;
                        }else if(NameClass=="h"){
                            pathPaper = "M"+(x-i)+" "+(y+1)+"L"+(x+width+i)+" "+(y+1)+"";
                            _this.SetstWall.push(_this.traceWall(pathPaper));
                            _this.stWall[idLigne][idCell].h = _this.SetstWall[i_SetstWall];
                            i_SetstWall++;
                        }else if(NameClass=="d"){
                            pathPaper = "M"+(x+width-1)+" "+(y-i)+"L"+(x+width-1)+" "+(y+height+i)+"";
                            _this.SetstWall.push(_this.traceWall(pathPaper));
                            _this.stWall[idLigne][idCell].d = _this.SetstWall[i_SetstWall];
                            i_SetstWall++;
                        }
                        
                    }
                });
                _this.stCell[idLigne][idCell].attr({"fill":"#fff","stroke":"#ddd"});
                _this.stCell[idLigne][idCell].click(function(event){
                    this.attr({"stroke":(this.attr("stroke")!="#f00")?"#f00":"green"});
                    this.toFront();
                    _this.SetstWall.toFront();
                });
                _this.stCell[idLigne][idCell].mouseout(function(event){
                    this.attr({"fill":"#fff"});
                });
                _this.stCell[idLigne][idCell].mouseover(function(event){
                    this.attr({"fill":"#0FF"});
                });
            });
        });
        _this.SetstWall.toFront();
    };
    
    $.getJSON( "/"+document.getElementById('idGame').value, function( grille ) {
        _this.createBoard(grille.board);
    });
}

$(document).ready(function(){
    var paper = new oRBoard(500,500);
});


function createRobots(robotElements){
    $.each(robotElements,function(idRobot,robot){
        //console.log(robot);
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
         //console.log(grille.robots);
         createBoard(grille.board);
         createTarget(grille.target);
         createRobots(grille.robots);
    });
}

function playGame() {
    console.log("que le jeu commence");
    
}



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
	playGame();
}
