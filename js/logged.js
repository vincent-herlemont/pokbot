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
    //matrice*DoubleTab : [ligne][colum]{"g,b,h,d,cell"}
    this.st = []; // Matrice : grille avec des pointeurs. this.st[1][1].cell = cellule this.st[1][1].g = bordure gauche
    
    //ObjetPaper
    this.paperSt = {}
    this.paperSt.cells = paper.set(); // references memoires ne pas s'en servir
    this.paperSt.walls = paper.set(); // references memoires ne pas s'en servir
    
    this.cellSize = {};
    this.paperSt.robots = paper.set();
    
    this.traceWall = function(pathPaper){
        var paperElement = paper.path(pathPaper);
        paperElement.attr({"stroke-width":2});
        return paperElement;
    }
    
    this.createRobots = function(robots){
       var _this = this;
	    var rb ;
       $.each(robots,function(idRobot,robot){
	
	var new_cell = _this.st[robot.line][robot.column].cell;
	var x  = new_cell.attr("x");
	var y = new_cell.attr("y");
	          
       _this.paperSt.robots.push(paper.rect(x,y,(_this.cellSize.width),(_this.cellSize.width)));
       
       _this.paperSt.robots[idRobot].pokBot = {};
       _this.paperSt.robots[idRobot].pokBot.x = robot.column;
        _this.paperSt.robots[idRobot].pokBot.y = robot.line;       
        _this.paperSt.robots[idRobot].attr({"fill":robot.color});


       });
       _this.paperSt.robots.attr({"stroke":"#ddd"});
       _this.paperSt.robots.toFront();

    }
    
    this.createBoard = function(boardElements,callback){
        console.log(boardElements);
        _this.cellSize.width = (width/boardElements.length);
        var _idLineEnCour = 0;
        var _idCellEnCour = 0;
        var i_SetstWall = 0;
        $.each(boardElements,function(idLigne,ligne){
            _this.cellSize.height = (width/ligne.length);
            _idLineEnCour = idLigne;
            _this.st[idLigne] = [];
            $.each(ligne,function(idCell,cell){
                var i = 0
                var u = (i/ligne.length);
                
                _this.paperSt.cells.push(paper.rect(  
                ((_this.cellSize.width))*idCell,
                ((_this.cellSize.width))*_idLineEnCour,
                (_this.cellSize.width-i),
                (_this.cellSize.width-i)));
                
                _this.st[idLigne][idCell] = {};
                _this.st[idLigne][idCell].cell = _this.paperSt.cells[_idCellEnCour];
                _this.paperSt.cells[_idCellEnCour].pokBot = {};
                _this.paperSt.cells[_idCellEnCour].pokBot.x = idCell;
                _this.paperSt.cells[_idCellEnCour].pokBot.y = idLigne;
                _idCellEnCour++;
                $.each(cell, function(NameClass, value) {
                    var x = _this.st[idLigne][idCell].cell.attr("x");
                    var y = _this.st[idLigne][idCell].cell.attr("y");
                    var width = _this.st[idLigne][idCell].cell.attr("width");
                    var height = _this.st[idLigne][idCell].cell.attr("height");
                    var pathPaper = "";
                    if(value==1){
                        if(NameClass=="g"){
                            pathPaper = "M"+(x+1)+" "+(y-i)+"L"+(x+1)+" "+(y+height+i)+"";
                            _this.paperSt.walls.push(_this.traceWall(pathPaper));
                            _this.st[idLigne][idCell].g = _this.paperSt.walls[i_SetstWall];
                            i_SetstWall++;
                        }else if(NameClass=="b"){
                            pathPaper = "M"+(x-i)+" "+(y+height-1)+"L"+(x+width+i)+" "+(y+height-1)+"";
                            _this.paperSt.walls.push(_this.traceWall(pathPaper));
                            _this.st[idLigne][idCell].b = _this.paperSt.walls[i_SetstWall];
                            i_SetstWall++;
                        }else if(NameClass=="h"){
                            pathPaper = "M"+(x-i)+" "+(y+1)+"L"+(x+width+i)+" "+(y+1)+"";
                            _this.paperSt.walls.push(_this.traceWall(pathPaper));
                            _this.st[idLigne][idCell].h = _this.paperSt.walls[i_SetstWall];
                            i_SetstWall++;
                        }else if(NameClass=="d"){
                            pathPaper = "M"+(x+width-1)+" "+(y-i)+"L"+(x+width-1)+" "+(y+height+i)+"";
                            _this.paperSt.walls.push(_this.traceWall(pathPaper));
                            _this.st[idLigne][idCell].d = _this.paperSt.walls[i_SetstWall];
                            i_SetstWall++;
                        }
                         
                    }  
                });
            });
        });
        _this.paperSt.walls.toFront();
        _this.paperSt.cells.toBack();
        _this.paperSt.cells.attr({"fill":"#fff","stroke":"#ddd"});
        _this.paperSt.cells.mouseout(function(event){
                    _this.createCross(this,"#FFF");
                });
        _this.paperSt.cells.mouseover(function(event){
                    _this.createCross(this,"#FFD");
                    _this.createMoveCross(this,"#FDF");
                });
        _this.paperSt.cells.click(function(event){
            this.toFront();
            _this.paperSt.walls.toFront();
            console.log(this.pokBot);
            console.log(_this.st[this.pokBot.y][this.pokBot.x]);

        });
	callback();
    };
    
    this.createCross = function(stElement,color){
        for(var y=0;y<_this.st.length;y++){
            _this.st[y][stElement.pokBot.x].cell.attr({"fill":color});
        }
        for(var x=0;x<_this.st.length;x++){
            _this.st[stElement.pokBot.y][x].cell.attr({"fill":color});
        }
    }
    this.createMoveCross = function(stElement,color){
        
        //Y
        for(var yb=stElement.pokBot.y;yb<_this.st.length;yb++){
            if(_this.st[yb][stElement.pokBot.x]["h"]!=undefined&&yb!=stElement.pokBot.y){
                break;
            }else{
               _this.st[yb][stElement.pokBot.x].cell.attr({"fill":color});
            }
            if(_this.st[yb][stElement.pokBot.x]["b"]!=undefined){
                break;
            }
        }
        for(var yh=stElement.pokBot.y;yh>=0;yh--){
            if(_this.st[yh][stElement.pokBot.x]["b"]!=undefined&&yh!=stElement.pokBot.y){
                break;
            }else{
               _this.st[yh][stElement.pokBot.x].cell.attr({"fill":color});
            }
            if(_this.st[yh][stElement.pokBot.x]["h"]!=undefined){
                break;
            }
        }
        
        //X
        for(var xd=stElement.pokBot.x;xd<_this.st[stElement.pokBot.y].length;xd++){
            if(_this.st[stElement.pokBot.y][xd]["g"]!=undefined&&xd!=stElement.pokBot.x){
                break;
            }else{
                _this.st[stElement.pokBot.y][xd].cell.attr({"fill":color});
            }
            if(_this.st[stElement.pokBot.y][xd]["d"]!=undefined){
                break;
            }
        }
        for(var xg=stElement.pokBot.x;xg>=0;xg--){
            if(_this.st[stElement.pokBot.y][xg]["d"]!=undefined&&xg!=stElement.pokBot.x){
                break;
            }else{
                _this.st[stElement.pokBot.y][xg].cell.attr({"fill":color});
            }
            if(_this.st[stElement.pokBot.y][xg]["g"]!=undefined){
                break;
            }
        }
    }
    
    $.getJSON( "/"+document.getElementById('idGame').value, function( grille ) {
        _this.createBoard(grille.board,function(){
	  _this.createRobots(grille.robots);
	}
	);
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
