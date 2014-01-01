taillePlateau = 10;
var _login, _idGame;
$().ready(function () {
    _login = document.getElementById('login').value;
    _idGame = document.getElementById('idGame').value;
});

function oRBoard(width, height) {
    var _this = this;
    console.log(taillePlateau);
    var paper = new Raphael(document.getElementById('partieRaphael'), width, height);
      
      var svg = document.querySelector("svg");
     // svg.removeAttribute("width");
      //svg.removeAttribute("height");
      
      paper.setViewBox(0,0,800,800,true);
          paper.setSize('100%', '100%');
   //   paper.canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');
     
    //matric*DoubleTab : [ligne][colum]{"g,b,h,d,cell"}
    this.st = []; // Matrice : grille avec des pointeurs. this.st[1][1].cell = cellule this.st[1][1].g = bordure gauche

    this.play = {}
    this.play.succes = false;

    //ObjetPaper
    this.paperSt = {};
    this.paperSt.cells = paper.set(); // references memoires ne pas s'en servir
    this.paperSt.walls = paper.set(); // references memoires ne pas s'en servir
    this.paperObj = {};
    this.paperObj.target = null;

    //Caractéritique cellules
    this.cellSize = {};
    this.cellSize.width = 0;
    this.cellSize.height = 0;
    this.colorCell = {};

    //Caractéritique Robots
    this.colorCell.destination = "#FFCC99";
    this.colorCell.versDestination = "#FFFFCC";
    this.paperSt.robots = paper.set();
    this.oJsonProposition = [];
    this.oJsonSendProposition = {
        "idGame": _idGame,
        "login": _login,
        "proposition": _this.oJsonProposition
    };

    this.traceWall = function (pathPaper) {
        var paperElement = paper.path(pathPaper);
        paperElement.attr({"stroke-width": 2});
        return paperElement;
    };
    
	 
    this.convertGrilleToCardinal = function (objGrille) {
        var new_cell = null;
        try {
            new_cell = _this.st[objGrille.line][objGrille.column].cell;
        } catch (err) {
        }
        ;
        try {
            new_cell = _this.st[objGrille.l][objGrille.c].cell;
        } catch (err) {
        }
        ;
        var _x = new_cell.attr("x");
        var _y = new_cell.attr("y");
        return {x: _x, y: _y};
    }
    this.convertGrilleToCardinal.center = function (objGrille) {
        var r = _this.convertGrilleToCardinal(objGrille);
        r.x = r.x + (_this.cellSize.width / 2);
        r.y = r.y + (_this.cellSize.height / 2);
        return r;
    }
    this.createTarget = function (target) {
        var cardinal = _this.convertGrilleToCardinal.center(target);
        _this.paperObj.target = paper.circle(cardinal.x, cardinal.y, _this.cellSize.width / 2.5);
        _this.paperObj.target.attr({"fill": target.t});
        _this.paperObj.target.attr({"stroke": "#ddd"});
        _this.paperObj.target.pokBot = {};
        _this.paperObj.target.pokBot.x = target.c;
        _this.paperObj.target.pokBot.y = target.l;
        _this.paperObj.target.toFront();
    }
    this.createRobots = function (robots) {
        var _this = this;

        $.each(robots, function (idRobot, robot) {

            var cardinal = _this.convertGrilleToCardinal(robot);
	    var src = "images/robot" + robot.color +".svg";
            _this.paperSt.robots.push(paper.image(src, cardinal.x, cardinal.y, (_this.cellSize.width), (_this.cellSize.width)));
            _this.paperSt.robots[idRobot].pokBot = {};
            _this.paperSt.robots[idRobot].pokBot.x = robot.column;
            _this.paperSt.robots[idRobot].pokBot.y = robot.line;
            _this.paperSt.robots[idRobot].pokBot.y.type = "target";
            _this.paperSt.robots[idRobot].attr({"fill": robot.color});
	    

        });
        _this.paperSt.robots.attr({"stroke": "#ddd"});
        _this.paperSt.robots.toFront();
        _this.paperSt.robots.mouseup(_this.createRobots.handleProposeMove);
        _this.paperSt.walls.toFront();

    };
    this.createRobots.handleProposeMove = function () {
        if (_this.proposeMove.handleCells.lock == false) {
            _this.proposeMove.unhandle()
            _this.proposeMove(this);
        }
    };
    this.sendPropositon = function (f, _robot, _cell) {
        if (_this.play.succes == false) {
            $.post("proposition", _this.oJsonSendProposition, function (data) {
                try {
                    f(data, _robot, _cell);
                    if (data.state == "INCOMPLETE") {
		    console.log("incomplete");
                    } else if (data.state == "SUCCESS") {
                        $('#indic').show();
                        _this.play.succes = true;
                    } else {
                        _this.oJsonProposition.pop();
                    }
                } catch (err) {
                }
            });
        }
    };
    this.proposeMove = function (robot) {
        _this.proposeMove.robot = robot;
        var couleurRobot = robot.attr("fill");
        var proposition = {
            "command": "select",
            "robot": couleurRobot
        }
        _this.oJsonProposition.push(proposition);
        _this.sendPropositon(function (data, robot) {
            console.log(robot.pokBot);
            $.each(data.nextPositions, function (i, value) {
                _this.st[value.l][value.c].cell.attr({"fill": _this.colorCell.destination});
                _this.st[value.l][value.c].cell.mouseup(_this.proposeMove.handleCells);
                _this.proposeMove.cells.push(_this.st[value.l][value.c].cell);
                if (_this.paperObj.target.pokBot.x == value.c && _this.paperObj.target.pokBot.y == value.l) {
                    _this.paperObj.target.mouseup(_this.proposeMove.handleCells);
                }
            })
        }, robot);
    }
    this.proposeMove.cells = [];
    this.proposeMove.unhandle = function () {
        if (_this.proposeMove.robot != undefined) {
            _this.createMoveCross(_this.proposeMove.robot, "#FFF");
            _this.createCross(_this.proposeMove.robot, "#FFF");
        }
        if (_this.proposeMove.cells.length > 0) {
            try {
                _this.paperObj.target.unmouseup(_this.proposeMove.handleCells);
            } catch (err) {
            }
            ;
            $.each(_this.proposeMove.cells, function (i, cell) {
                _this.proposeMove.cells.pop();
                try {
                    cell.unmouseup(_this.proposeMove.handleCells);
                } catch (err) {
                }
                ;
            });
        }
    }
    this.proposeMove.handleCells = function () {
        if (_this.proposeMove.handleCells.lock == false) {
            _this.proposeMove.handleCells.lock = true;
            var proposition = {
                "command": "move",
                "line": this.pokBot.y + "",
                "column": this.pokBot.x + ""
            }
            _this.oJsonProposition.push(proposition);
            _this.sendPropositon(function (data, robot, cell) {
                _this.moveRobot(robot, cell);
            }, _this.proposeMove.robot, this);
        }
    }
    this.proposeMove.handleCells.lock = false;
    this.moveRobot = function (robot, cell) {
        _this.createMoveCross(robot, "#FFF");
        _this.createCross(robot, "#FFF");
        robot.pokBot.y = cell.pokBot.y;
        robot.pokBot.x = cell.pokBot.x;
        if (cell.pokBot.type == "cell") {
            robot.animate({x: cell.attr("x"), y: cell.attr("y") }, 600, function () {
                    robot.attr({"x": cell.attr("x"), "y": cell.attr("y")});
                    _this.proposeMove.handleCells.lock = false;
                    _this.proposeMove.unhandle();
                }
            );
        } else {
            robot.animate({x: cell.attr("cx") - (_this.cellSize.width / 2), y: cell.attr("cy") - (_this.cellSize.height / 2) }, 600, function () {
                    robot.attr({"x": cell.attr("cx") - (_this.cellSize.width / 2), "y": cell.attr("cy") - (_this.cellSize.height / 2)});
                    _this.proposeMove.handleCells.lock = false;
                    _this.proposeMove.unhandle();
                }
            );
        }
    }
    this.createBoard = function (boardElements, callback) {

        console.log(boardElements);
        _this.cellSize.width = (width / boardElements.length);
        var _idLineEnCour = 0;
        var _idCellEnCour = 0;
        var i_SetstWall = 0;

        $.each(boardElements, function (idLigne, ligne) {
            _this.cellSize.height = (height / ligne.length);
            _idLineEnCour = idLigne;
            _this.st[idLigne] = [];
            $.each(ligne, function (idCell, cell) {
                var i = 0
                _this.paperSt.cells.push(paper.rect(
                    ((_this.cellSize.width)) * idCell,
                    ((_this.cellSize.width)) * _idLineEnCour,
                    (_this.cellSize.width - i),
                    (_this.cellSize.width - i)));

                _this.st[idLigne][idCell] = {};
                _this.st[idLigne][idCell].cell = _this.paperSt.cells[_idCellEnCour];
                _this.paperSt.cells[_idCellEnCour].pokBot = {};
                _this.paperSt.cells[_idCellEnCour].pokBot.x = idCell;
                _this.paperSt.cells[_idCellEnCour].pokBot.y = idLigne;
                _this.paperSt.cells[_idCellEnCour].pokBot.type = "cell";
                _idCellEnCour++;
                $.each(cell, function (NameClass, value) {
                    var x = _this.st[idLigne][idCell].cell.attr("x");
                    var y = _this.st[idLigne][idCell].cell.attr("y");
                    var width = _this.st[idLigne][idCell].cell.attr("width");
                    var height = _this.st[idLigne][idCell].cell.attr("height");
                    var pathPaper = "";
                    if (value == 1) {
                        if (NameClass == "g") {
                            pathPaper = "M" + (x + 1) + " " + (y - i) + "L" + (x + 1) + " " + (y + height + i) + "";
                            _this.paperSt.walls.push(_this.traceWall(pathPaper));
                            _this.st[idLigne][idCell].g = _this.paperSt.walls[i_SetstWall];
                            i_SetstWall++;
                        } else if (NameClass == "b") {
                            pathPaper = "M" + (x - i) + " " + (y + height - 1) + "L" + (x + width + i) + " " + (y + height - 1) + "";
                            _this.paperSt.walls.push(_this.traceWall(pathPaper));
                            _this.st[idLigne][idCell].b = _this.paperSt.walls[i_SetstWall];
                            i_SetstWall++;
                        } else if (NameClass == "h") {
                            pathPaper = "M" + (x - i) + " " + (y + 1) + "L" + (x + width + i) + " " + (y + 1) + "";
                            _this.paperSt.walls.push(_this.traceWall(pathPaper));
                            _this.st[idLigne][idCell].h = _this.paperSt.walls[i_SetstWall];
                            i_SetstWall++;
                        } else if (NameClass == "d") {
                            pathPaper = "M" + (x + width - 1) + " " + (y - i) + "L" + (x + width - 1) + " " + (y + height + i) + "";
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
        _this.paperSt.cells.attr({"fill": "#fff", "stroke": "#ddd"});
        callback();
    };
    this.createCross = function (stElement, color) {
        for (var y = 0; y < _this.st.length; y++) {
            _this.st[y][stElement.pokBot.x].cell.attr({"fill": color});
        }
        for (var x = 0; x < _this.st.length; x++) {
            _this.st[stElement.pokBot.y][x].cell.attr({"fill": color});
        }
    }
    this.createMoveCross = function (stElement, color, colorEnd) {
        var lastx1 = "";
        var lasty1 = "";
        var lastx2 = "";
        var lasty2 = "";
        for (var yb = stElement.pokBot.y; yb < _this.st.length; yb++) {
            if (_this.st[yb][stElement.pokBot.x]["h"] != undefined && yb != stElement.pokBot.y) {
                break;
            } else {
                _this.st[yb][stElement.pokBot.x].cell.attr({"fill": color});
                lastx1 = _this.st[yb][stElement.pokBot.x].cell;
            }
            if (_this.st[yb][stElement.pokBot.x]["b"] != undefined) {
                break;
            }
        }
        lastx1.attr({"fill": colorEnd});

        for (var yh = stElement.pokBot.y; yh >= 0; yh--) {
            if (_this.st[yh][stElement.pokBot.x]["b"] != undefined && yh != stElement.pokBot.y) {
                break;
            } else {
                lastx2 = _this.st[yh][stElement.pokBot.x].cell.attr({"fill": color});
            }
            if (_this.st[yh][stElement.pokBot.x]["h"] != undefined) {
                break;
            }
        }
        lastx2.attr({"fill": colorEnd});


        //X
        for (var xd = stElement.pokBot.x; xd < _this.st[stElement.pokBot.y].length; xd++) {
            if (_this.st[stElement.pokBot.y][xd]["g"] != undefined && xd != stElement.pokBot.x) {
                break;
            } else {
                lasty1 = _this.st[stElement.pokBot.y][xd].cell.attr({"fill": color});
            }
            if (_this.st[stElement.pokBot.y][xd]["d"] != undefined) {
                break;
            }
        }
        lasty1.attr({"fill": colorEnd});

        for (var xg = stElement.pokBot.x; xg >= 0; xg--) {
            if (_this.st[stElement.pokBot.y][xg]["d"] != undefined && xg != stElement.pokBot.x) {
                break;
            } else {
                lasty2 = _this.st[stElement.pokBot.y][xg].cell.attr({"fill": color});
            }
            if (_this.st[stElement.pokBot.y][xg]["g"] != undefined) {
                break;
            }
        }
        lasty2.attr({"fill": colorEnd});

    }
    $.getJSON("/" + document.getElementById('idGame').value, function (grille) {
        _this.createBoard(grille.board, function () {
                _this.createTarget(grille.target);
                _this.createRobots(grille.robots);
            }
        );
    });
}
$(document).ready(function () {
    oRBoard = new oRBoard(800, 800);
});


function init() {
    // Connect to the SocketIO server to retrieve ongoing games.
    socket = io.connect();
    socket.on('participants', function (data) {
        var ul = document.getElementById('lesParticipants');
        ul.innerHTML = '';
        for (p in data.participants) {
	  console.log("participants");
            var li = document.createElement('li');
            ul.appendChild(li);
            li.appendChild(document.createTextNode(data.participants[p]));
        }
    });
    socket.on('FinalCountDown', function (data) {
        var ms = data.FinalCountDown;
        console.log("FinalCountDown : " + ms);
    });
    socket.on('TerminateGame', function (data) {
        h1 = document.querySelector('body > header > h1');
        h1.innerHTML += ' est terminée !';
    });
    socket.on('solutions', function (data) {
        console.log("Solutions are :\n" + JSON.stringify(data.solutions));
    });
    socket.emit('identification', {
            login: _login,
            idGame: _idGame
        }
    );
}