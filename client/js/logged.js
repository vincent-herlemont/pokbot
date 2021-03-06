taillePlateau = 10;
var _login, _idGame;
var _play = {}

$().ready(function () {
    _login = document.getElementById('login').value;
    _idGame = document.getElementById('idGame').value;
    _play.succes = false;
    _play.firstWinner = true;
    _play.finish = false;
    _play.timeLeft = 0;
    $(".help").click(function(){
      if($("#helpDiv").is(":visible")){
	$("#helpDiv").fadeOut(150);
      }else{
	$("#helpDiv").fadeIn(150);
      }
    });
});

function oRBoard(width, height) {
    var _this = this;
    console.log(taillePlateau);
    var paper = new Raphael(document.getElementById('partieRaphael'), width, height);

    paper.setViewBox(0, 0, 800, 800, true);
    paper.setSize('100%', '100%');
    paper.canvas.setAttribute('preserveAspectRatio', 'xMinYMin');

    //matric*DoubleTab : [ligne][colum]{"g,b,h,d,cell"}
    this.st = []; // Matrice : grille avec des pointeurs. this.st[1][1].cell = cellule this.st[1][1].g = bordure gauche

    _play.succes = false;
    this.nbCoups = 0;
    this.time = 0;
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
    
    this.colorRobotEnCour = "";


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
            var src = "images/robot" + robot.color + ".svg";
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
        if (_play.succes == false) {
            $.post("proposition", _this.oJsonSendProposition, function (data) {
                try {
                    f(data, _robot, _cell);
                    if (data.state == "INCOMPLETE") {
                        if (_this.oJsonProposition[_this.oJsonProposition.length - 1].command == "move") {
                            _this.nbCoups++;
                            $(".nbCoups span").text(_this.nbCoups);
                        }
                        console.log("incomplete");
                    } else if (data.state == "SUCCESS") {
                        _play.succes = true;
                        _this.nbCoups++;
                        $('#indic').text("Bravo ! Vous avez trouvé !");
                        $('#indic').show();

                    } else if (data.state == "INVALID_MOVE") {
                        $("#error").text("Ce mouvement n'est pas permis !");
                        $("#error").fadeIn().delay(700).fadeOut();
                        _this.oJsonProposition.pop();
                    } else if (data.state == "INVALID_SELECT") {
                        $("#error").text("Ce robot a déja été déplacé !");
                        $("#error").fadeIn().delay(700).fadeOut();
                        _this.oJsonProposition.pop();
                    }
                } catch (err) {
                }
            });
        }
    };
    this.SYSselectRobot = function (couleur) {
        $.each(_this.paperSt.robots, function (i, value) {
            if (value.attr("fill") == couleur) {
                _this.proposeMove(value);
            }
        });
    }
    this.proposeMove = function (robot) {
        _this.proposeMove.robot = robot;
        var couleurRobot = robot.attr("fill");
        var proposition = {
            "command": "select",
            "robot": couleurRobot
        }
        _this.oJsonProposition.push(proposition);
        $.each(_this.proposeMove.cells, function (i, cell) {
            try {
                cell.attr({"fill": "#fff"});
                cell.unmouseup(_this.proposeMove.handleCells);
            } catch (err) {
            }
            ;
            delete _this.proposeMove.cells[i];
        });
        _this.sendPropositon(function (data, robot) {
            console.log(robot.pokBot);
            $.each(data.nextPositions, function (i, value) {
                _this.st[value.l][value.c].cell.attr({"fill": _this.colorCell.destination});
                _this.st[value.l][value.c].cell.mouseup(_this.proposeMove.handleCells);
                _this.proposeMove.cells.push(_this.st[value.l][value.c].cell);
                if (_this.paperObj.target.pokBot.x == value.c && _this.paperObj.target.pokBot.y == value.l) {
                    _this.paperObj.target.mouseup(_this.proposeMove.handleCells);
                }
            });
            _this.colorRobotEnCour = robot.attr("fill");
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
                try {
                    cell.unmouseup(_this.proposeMove.handleCells);
                } catch (err) {
                }
                ;
                delete _this.proposeMove.cells[i];
            });
        }
    }
    this.proposeMove.SYShandleCells = function (couleurRobot, direction) {
        var i_cacheLockCell = false;
        if (_this.proposeMove.handleCells.lock == false) {
            _this.proposeMove.handleCells.lock = true;
            console.log("Couleur robot : " + couleurRobot);
            console.log("Direction : " + direction);

            function sendCellProposition(x_robot, x_rep_cell) {
                i_cacheLockCell = true;
                var proposition = {
                    "command": "move",
                    "line": x_rep_cell.pokBot.y + "",
                    "column": x_rep_cell.pokBot.x + ""
                }
                _this.oJsonProposition.push(proposition);
                _this.sendPropositon(function (data, robot, cell) {
                    _this.moveRobot(robot, cell);
                }, x_robot, x_rep_cell);
            }

            function setCaseByDirection(robot) {
                console.log(_this.proposeMove.cells);
                $.each(_this.proposeMove.cells, function (i, cell) {
                    console.log(cell);
                    if(cell!=undefined){
                        if (cell.pokBot.y == robot.pokBot.y) {
                            if (cell.pokBot.x <= robot.pokBot.x && direction == "left") {
                                sendCellProposition(robot, cell);
                            } else if (cell.pokBot.x >= robot.pokBot.x && direction == "right") {
                                sendCellProposition(robot, cell);
                            }
                        } else if (cell.pokBot.x == robot.pokBot.x) {
                            if (cell.pokBot.y <= robot.pokBot.y && direction == "top") {
                                sendCellProposition(robot, cell);
                            } else if (cell.pokBot.y >= robot.pokBot.y && direction == "bottom") {
                                sendCellProposition(robot, cell);
                            }
                        }
                    }
                });
                if(i_cacheLockCell==false){
                    _this.proposeMove.handleCells.lock = false;
                }
            }
            if (_this.proposeMove.robot != undefined) {
                $.each(_this.paperSt.robots, function (i, robot) {
                    if (robot.attr("fill") == couleurRobot) {
                        setCaseByDirection(robot);
                    }
                });
            }
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
                    //Rapppel de la selection du robot
                    oRBoard.SYSselectRobot(robot.attr("fill"));
                    _this.proposeMove.unhandle();
                }
            );
        } else {
            robot.animate({x: cell.attr("cx") - (_this.cellSize.width / 2), y: cell.attr("cy") - (_this.cellSize.height / 2) }, 600, function () {
                    robot.attr({"x": cell.attr("cx") - (_this.cellSize.width / 2), "y": cell.attr("cy") - (_this.cellSize.height / 2)});
                    _this.proposeMove.handleCells.lock = false;
                    //Rapppel de la selection du robot
                    oRBoard.SYSselectRobot(robot.attr("fill"));
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
    this.initCount = function () {
        _this.time = 0; // uptime in seconds
        var timer = setInterval(
            function () {
                if (!_play.succes) {
                    _this.time++;
                    $(".temps span").text(_this.time + 's');
                } else {
                    clearInterval(timer);
                }
            }, 1000
        );
        $(".nbCoups span").text(0);
        _this.nbCoups = 0;
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
                _this.initCount();
            }
        );
    });
}
$(document).ready(function () {
    oRBoard = new oRBoard(800, 800);
});

function displayFinish(data) {
    _play.finish = true;
    if (!_play.succes) {
        alert("cest terminé vous avez perdu !");
        $("#indic").hide();
    }
}

function initDecount() {
    _play.timeLeft = 60; // uptime in seconds
    var timer = setInterval(
        function () {
            if (!_play.finish) {
                _play.timeLeft--;
                $("#indic span").text(_play.timeLeft);
            } else {
                clearInterval(timer);
            }
        }, 1000
    );
}

function displayResult(data) {
    //$("#indic").text("il vous reste :" + data);
    $.each(data, function (idData, result) {
        var joueurGagnant = result.player;
        var nbCoups = 0;
        $.each(result.proposition, function (idprop, prop) {
            if (prop.command == "move") {
                nbCoups++;
            }
        });
        $('#lesParticipants li:contains(' + joueurGagnant + ')').text(joueurGagnant + " a trouvé en " + nbCoups + " coups");
    });
    if ((!_play.succes) && _play.firstWinner) {
        $("#indic").text("");
        initDecount();
        initDecount
        $("#indic").append(" Il vous reste <span class='decount'>" + _play.timeLeft + "</span> secondes ! ");
        $("#indic").fadeIn();
        _play.firstWinner = false;
    }
}

function init() {
    // Connect to the SocketIO server to retrieve ongoing games.
    socket = io.connect();
    var _this = this;
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
        $('.logged').append("est terminée !");
        displayFinish(data);
    });
    socket.on('solutions', function (data) {
        console.log("Solutions are :\n" + JSON.stringify(data));
        displayResult(data.solutions);
    });
    socket.on('ordreMobileServeur', function (data) {
        console.log("OrdreMobile are :\n" + JSON.stringify(data));
        if (data["action"] != undefined) {
            if (data.action == "move") {
                if (data["robot"] != undefined) {
                    oRBoard.SYSselectRobot(data.robot);
                }
            }
            if (data.action == "select") {
                if (data["data"] != undefined) {
                    var res = data["data"].split("-");
                    oRBoard.proposeMove.SYShandleCells(res[1], res[2]);
                }
            }
        }
        console.log("lock : "+oRBoard.proposeMove.handleCells.lock);
    });
    socket.emit('identification', {
            login: _login,
            idGame: _idGame,
            plateau: true
        }
    );
    
    $(document).keydown(function(e){
        if (e.keyCode == 37) { 
           oRBoard.proposeMove.SYShandleCells(oRBoard.colorRobotEnCour,"left");
           return false;
        }
        if (e.keyCode == 38) { 
           oRBoard.proposeMove.SYShandleCells(oRBoard.colorRobotEnCour,"top");
           return false;
        }
        if (e.keyCode == 39) { 
           console.log(oRBoard.colorRobotEnCour);
           oRBoard.proposeMove.SYShandleCells(oRBoard.colorRobotEnCour,"right");
           return false;
        }
        if (e.keyCode == 40) { 
           oRBoard.proposeMove.SYShandleCells(oRBoard.colorRobotEnCour,"bottom");
           return false;
        }
        if (e.keyCode == 82) { 
            oRBoard.SYSselectRobot("red");
            return false;
        }
        if (e.keyCode == 71) { 
            oRBoard.SYSselectRobot("green");
            return false;
        }
        if (e.keyCode == 89) { 
            oRBoard.SYSselectRobot("yellow");
            return false;
        }
        if (e.keyCode == 66) { 
            oRBoard.SYSselectRobot("blue");
            return false;
        }
    });
    
}
