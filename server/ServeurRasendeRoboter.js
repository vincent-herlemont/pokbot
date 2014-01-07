var rasendeRoboter = require("./RasendeRoboter");
var users_soIO = {}
var _server = {
    pathClientPokbot: __dirname + "/../client/",
    fs: require('fs'), express: require('express'), app: null, io: require('socket.io'),
    games: { list: {}, ProcessProposition: function (idGame, playerName, proposition) {
        if (this.list[idGame] == undefined) {
            throw new Error('NO_SUCH_GAME_ID');
        }
        if (this.list[idGame].participants[playerName] == undefined) {
            throw new Error('PLAYER_IS_NOT_PRESENT');
        }
        if (this.list[idGame].Terminated) {
            return {state: 'TOO_LATE', details: 'The game is over...', nextPositions: []};
        }
        var answer = this.list[idGame].game.ProcessProposition(proposition);
        if (answer.state == 'SUCCESS') {
            if (this.list[idGame].finalCountDown) {
                _server.games.OtherFinalProposition(idGame, playerName, proposition);
            } else {
                _server.games.FinalCountDown(idGame, playerName, proposition);
            }
        }
        return answer;
    }, new: function (id) {//console.log('Opening game ' + id);
        if (this.list[id]) {
            throw new Error('NOT_UNIQUE_ID');
        }
        this.list[id] = {ms: 60000, participants: {}, propositions: [], game: (new rasendeRoboter.RasendeRoboter()).init()}
        setTimeout(function () {
            _server.games.checkParticipants(id);
        }, 5000);
        _server.sendGamesInfo();
    }, close: function (id) {//console.log('Closing game ' + id);
        if (this.list[id] == undefined) {
            throw new Error('NO_SUCH_GAME_ID');
        }
        delete this.list[id];
        _server.sendGamesInfo();
    }, joining: function (idGame, playerName) {
        if (this.list[idGame] == undefined) {
            throw new Error('NO_SUCH_GAME_ID');
        }
        if (this.list[idGame].participants[playerName] == undefined) {
            //console.log("\tParticipant " + playerName + ' is joining game ' + idGame);
            this.list[idGame].participants[playerName] = {name: playerName, sockets: new Array()};
        }
    }, leaving: function (idGame, playerName) {
        if (this.list[idGame] == undefined) {
            throw new Error('NO_SUCH_GAME_ID');
        }
        if (this.list[idGame].participants[playerName] == undefined) {
            throw new Error('PLAYER_IS_NOT_PRESENT');
        }
        //console.log("\tPlayer " + playerName + ' is leaving game ' + idGame);
        delete this.list[idGame].participants[playerName];
        this.sendListOfParticipants(idGame);
        setTimeout(function () {
            _server.games.checkParticipants(idGame);
        }, 5000);
    }, checkParticipants: function (idGame) {//console.log("\tcheckParticipants");
        if (this.list[idGame] == undefined) {
            return;
        }
        var nb = 0;
        for (i in this.list[idGame].participants) {
            //console.log("\t\tConsidering participant " + i + ' with ' + this.list[idGame].participants[i].sockets.length + ' sockets');
            if (this.list[idGame].participants[i].sockets.length > 0) {
                nb++;
            }
        }
        if (nb == 0) {
            this.close(idGame);
        }
    }, identification: function (idGame, playerName, socket) {
        if (this.list[idGame] == undefined) {
            throw new Error('NO_SUCH_GAME_ID');
        }
        if (this.list[idGame].participants[playerName] == undefined) {
            this.joining(idGame, playerName);
        }
        //console.log("\tParticipant " + playerName + " is connected on game " + idGame + " using socket " + socket.id);
        this.list[idGame].participants[playerName].sockets.push(socket);
        this.sendListOfParticipants(idGame);
    }, disconnect: function (socket) {
        for (var idGame in this.list) {
            for (var playerName in this.list[idGame].participants) {
                var i = this.list[idGame].participants[playerName].sockets.indexOf(socket);
                if (i >= 0) {
                    this.list[idGame].participants[playerName].sockets.splice(i, 1);
                    if (this.list[idGame].participants[playerName].sockets.length == 0) {
                        this.leaving(idGame, playerName);
                    }
                }
            }
        }
    }, emit: function (idGame, variable, value, targets) {
        targets = targets || this.list[idGame].participants;
        // Inform all participants that the list of participants has changed
        for (var p in targets) {
            for (var sock in this.list[idGame].participants[p].sockets) {
                this.list[idGame].participants[p].sockets[sock].emit(variable, value);
            }
        }
    }, sendListOfParticipants: function (idGame) {
        // List all participants
        var participants = [];
        for (var p in this.list[idGame].participants) {
            participants.push(p);
        }
        this.emit(idGame, 'participants', {participants: participants});
    }, FinalCountDown: function (idGame, playerName, proposition) {
        this.list[idGame].finalCountDown = true;
        this.list[idGame].solutions = [];
        var ms = this.list[idGame].ms;
        this.emit(idGame, 'FinalCountDown', {FinalCountDown: ms});
        this.OtherFinalProposition(idGame, playerName, proposition);
        setTimeout(function () {
                if (idGame != undefined) {
                    _server.games.TerminateGame(idGame);
                }
            }
            , ms);
    }, OtherFinalProposition: function (idGame, playerName, proposition) {
        if (this.list[idGame] == undefined) {
            throw new Error('NO_SUCH_GAME_ID');
        }
        this.list[idGame].solutions.push({player: playerName, proposition: proposition});
        this.emit(idGame, 'solutions', {solutions: this.list[idGame].solutions});
    }, TerminateGame: function (idGame) {
        if (this.list[idGame] == undefined) {
            throw new Error('NO_SUCH_GAME_ID');
        }
        this.emit(idGame, 'TerminateGame', {TerminateGame: true});
        this.list[idGame].Terminated = true;
    }
    }, sockets: [] // Sockets connected to the loggin page
    , connect: function (socket) {//console.log("Connection on loggin page of " + socket.id);
        if (this.sockets.indexOf(socket) < 0) {
            this.sockets.push(socket);
        }
        this.sendGamesInfo([socket]);
    }, disconnect: function (socket) {//console.log("Disonnection of loggin page of " + socket.id);
        var i = this.sockets.indexOf(socket);
        if (i >= 0) {
            this.sockets.splice(i, 1);
        }
        this.games.disconnect(socket);
    }, sendGamesInfo: function (sockets) {//console.log("--> Sending game informations");
        sockets = sockets || this.sockets;
        // Build the game list
        var gamesList = [];
        for (var g in this.games.list) {
            gamesList.push(g);
        }
        // Send it to all connected login pages
        for (var i in sockets) {
            sockets[i].emit('gamesList', {gamesList: gamesList});
        }
    }, init: function (port) {
        this.app = this.express().use(this.express.static(_server.pathClientPokbot))
            .use(this.express.bodyParser())
            .get('/', function (req, res) {

                var pathLoginPage = _server.pathClientPokbot + "login.xhtml";
                _server.fs.readFile(pathLoginPage,
                    function (err, data) {
                        if (err) {
                            res.writeHead(500);
                            return res.end('Error loading login.xhtml');
                        }
                        res.writeHead(200, {'Content-Type': 'application/xhtml+xml; charset=utf-8'});
                        res.end(data);
                    });
            })
            .post('/', function (req, res) {
                // POST VARIABLES :
                //        - login
                //        - idGame
                // Create or join the idGame
                try {
                    _server.games.joining(req.body.idGame, req.body.login);
                } catch (err) {
                    switch (err.message) {
                        case 'NO_SUCH_GAME_ID':
                            _server.games.new(req.body.idGame);
                            _server.games.joining(req.body.idGame, req.body.login);
                            break;
                        case 'PLAYER_ALREADY_PRESENT':
                            res.writeHead(500);
                            return res.end('Player ' + req.body.login + ' is already logged into game ' + req.body.idGame + '...');
                            break;
                        default:
                            console.log("Error while joining game:\n" + err);
                            break;
                    }
                }
                var tabletEnabled = false;
                if(_server.games.list[req.body.idGame].participants[req.body.login].sockets.length%2 != 0){
                    tabletEnabled = true;
                    _server.fs.readFile(_server.pathClientPokbot + './robot-control.html',
                    function (err, data) {

                        if (err) {
                            res.writeHead(500);
                            return res.end('Error loading logged.xhtml');
                        }
                        res.writeHead(200, {'Content-Type': 'application/xhtml+xml; charset=utf-8'});
                        var title = req.body.idGame
                            , state = '';
                        if (_server.games.list[req.body.idGame].Terminated) {
                            state += ' est terminée';
                        }
                        var tablet;
                        if(tabletEnabled){
                            tablet="true";
                        }else{
                            tablet="false";
                        }
                        res.write(data.toString().replace(/__LOGIN__/g, req.body.login)
                            .replace(/__IDGAME__/g, title)
                            .replace(/__STATE__/g, state)
                            .replace(/__TABLET__/g, tablet)
                        );
                        res.end();
                    });
                }else{
                    _server.fs.readFile(_server.pathClientPokbot + './logged.xhtml',
                      function (err, data) {

                            if (err) {
                                res.writeHead(500);
                                return res.end('Error loading logged.xhtml');
                            }
                            res.writeHead(200, {'Content-Type': 'application/xhtml+xml; charset=utf-8'});
                            var title = req.body.idGame
                                , state = '';
                            if (_server.games.list[req.body.idGame].Terminated) {
                                state += ' est terminée';
                            }
                            var tablet;
                            if(tabletEnabled){
                                tablet="true";
                            }else{
                                tablet="false";
                            }
                            res.write(data.toString().replace(/__LOGIN__/g, req.body.login)
                                .replace(/__IDGAME__/g, title)
                                .replace(/__STATE__/g, state)
                                .replace(/__TABLET__/g, tablet)
                            );
                            res.end();
                        });
                }
            })
            .use(function (req, res) {
                var idGame = req._parsedUrl.pathname.slice(1);
                var REST_command = idGame;
                if (req.method == "GET") {
                    // Is there a game with that URL ?


                    if (_server.games.list[ idGame ]) {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify(_server.games.list[ idGame ].game.getConfiguration()));
                        return;
                    }
                    res.writeHead(404);
                    res.write('Ressource does not exists, should be one of : ');
                    for (var game in _server.games.list) {
                        res.write(game + ' ');
                    }
                    res.end('.');
                }
                if (req.method == "POST") {
                    // console.log("Receiving a proposition :");
                    switch (REST_command) {
                        case 'proposition':
                            var answer = null;
                            // for(var i in req.body) {console.log("\t"+i+' : '+req.body[i]);}
                            try {
                                answer = _server.games.ProcessProposition(req.body.idGame
                                    , req.body.login
                                    , req.body.proposition);
                            }
                            catch (err) {
                                console.log(err);
                                switch (err.message) {
                                    case 'NO_SUCH_GAME_ID':
                                        _server.games.new(req.body.idGame);
                                        _server.games.joining(req.body.idGame, req.body.login);
                                        break;
                                    case 'PLAYER_IS_NOT_PRESENT':
                                        _server.games.joining(req.body.idGame, req.body.login);
                                        break;
                                    default:
                                        console.error("Error while processing proposition :\n" + err.detail);
                                        res.writeHead(400);
                                        res.end(JSON.stringify(err.detail));
                                        return;
                                }
                                answer = _server.games.ProcessProposition(req.body.idGame
                                    , req.body.login
                                    , JSON.parse(req.body.proposition));
                            }
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            // console.log( 'coucou' );
                            // console.log( "Send answer : " + JSON.stringify( answer ));
                            res.end(JSON.stringify(answer));
                            break;
                    }
                }
            })
            .listen(port);
        this.io = this.io.listen(this.app, { log: false });
        // assuming io is the Socket.IO _server object
        /*this.io.configure(function () {
         _server.io.set("transports", ["xhr-polling"]);
         _server.io.set("polling duration", 10);
         });*/

        this.io.on('connection', function (socket) {

                socket.on('loginPage'
                    , function (data) {
                        //console.log("Someone is connected on the loggin page...");
                        _server.connect(socket);
                    }
                );
                socket.on('identification'
                    , function (data) {
                        // console.log('Received identification ' + JSON.stringify(data));
                        _server.games.identification(data.idGame, data.login, socket);
                        if(data.plateau != undefined){
                            console.log("Ajout cannal plateau : "+data.idGame+"/"+data.login);
                            users_soIO[data.idGame+data.login] = socket;
                        }
                    }
                );
                socket.on('disconnect'
                    , function () {
                        _server.disconnect(socket);
                    }
                );
                socket.on('ordreMobile'
                    , function (obj) {
                        if(users_soIO[obj.idGame+obj.login]!=undefined){
                            console.log("Send ordreMobile");
                            users_soIO[obj.idGame+obj.login].emit("ordreMobileServeur",obj);
                        }
                        console.log(obj);
                    }
                );
            }
        );
    }
};

exports.server = _server;
