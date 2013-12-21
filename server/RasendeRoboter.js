var p = require('./plateau.js');
exports.RasendeRoboter = function () {
    return {
        dataPlateau: p.dataPlateau, cibles: p.cibles, cible: null, robots: [], init: function (idTable) {
            // Choisir une cible au hasard
            this.cible = Math.floor(Math.random() * this.cibles.length);
            // Placer les robots au hasard
            var robots = ['blue', 'red', 'green', 'yellow'];
            for (var i in robots) {
                var l = c = 7;
                do {
                    l = Math.floor(Math.random() * 16)
                    c = Math.floor(Math.random() * 16);
                    if (l >= 7 && l <= 8 && c >= 7 && c <= 8) continue;
                    if (this.cibles[this.cible].l == l
                        && this.cibles[this.cible].c == c) continue;
                    var samePlace = false;
                    for (var robot in this.robots) {
                        if (this.robots[robot].line == l
                            && this.robots[robot].column == c) {
                            samePlace = true;
                            break;
                        }
                    }
                    if (!samePlace) {
                        break;
                    }
                } while (true);
                this.robots.push({color: robots[i], line: l, column: c});
            }
            return this;
        }, getConfiguration: function () {
            return { board: this.dataPlateau, target: this.cibles[ this.cible ], robots: this.robots
            };
        }, NoRobot: function (robots, line, column) {
            for (r in robots) {
                if (robots[r].line == line
                    && robots[r].column == column) {
                    return false;
                }
            }
            return true;
        }, getNextPositionsFrom: function (robots, line, column) {
            // console.log("getNextPositionsFrom " +line+" "+column);
            var nexts = [], l, c;
            // Go left
            l = parseInt(line);
            c = parseInt(column);
            while (this.dataPlateau[l][c].g == undefined
                && this.dataPlateau[l][c - 1].d == undefined
                && this.NoRobot(robots, l, c - 1)){
                c--;
            }
            if (c != column) {
                nexts.push({l: line, c: c});
            }
            // Go right
            l = parseInt(line);
            c = parseInt(column);
            while (this.dataPlateau[l][c].d == undefined
                && this.dataPlateau[l][c + 1].g == undefined
                && this.NoRobot(robots, l, c + 1)) {
                c++;
            }
            if (c != column) {
                nexts.push({l: line, c: c});
            }
            // Go top
            l = parseInt(line);
            c = parseInt(column);
            while (this.dataPlateau[l][c].h == undefined
                && this.dataPlateau[l - 1][c].b == undefined
                && this.NoRobot(robots, l - 1, c)){
                l--;
            }
            if (l != line) {
                nexts.push({l: l, c: column});
            }
            // Go down
            l = parseInt(line);
            c = parseInt(column);
            while (this.dataPlateau[l][c].b == undefined
                && this.dataPlateau[l + 1][c].h == undefined
                && this.NoRobot(robots, l + 1, c)){
                l++;
            }
            if (l != line) {
                nexts.push({l: l, c: column});
            }
            // Results
            return nexts;
        }, isAmong: function (position, positions) {
            for (var p in positions) {
                if (position.l == positions[p].l
                    && position.c == positions[p].c) {
                    return true;
                }
            }
            return false;
        }, ProcessProposition: function (proposition) {
            var state = '', details = ''
                , nextPositions = [];
            // state : {INVALID_EMPTY, INVALID_SELECT, INVALID_MOVE, INCOMPLETE, SUCCESS}
            // nextPositions : list of possible next positions for the last moved robots
            // Copy robot positions
            var P = {}
                , currentRobot = null;
            for (var r in this.robots) {
                P[this.robots[r].color] = {line: this.robots[r].line, column: this.robots[r].column, color: this.robots[r].color};
            }
            // Go through the proposition
            for (var i = 0; i < proposition.length && state == ''; i++) {
                switch (proposition[i].command) {
                    case 'select':
                        if (P[ proposition[i].robot ] == undefined) {
                            throw new Error({error: 'INVALID_ROBOT', detail: proposition[i].robot + ' is not a robot, should be blue, red, yellow or green'});
                        }
                        if (P[ proposition[i].robot ].selected && currentRobot != P[ proposition[i].robot ]) {
                            state = "INVALID_SELECT";
                            details = 'You can not move again a robot after having released it';
                            break;
                        } else {
                            currentRobot = P[proposition[i].robot];
                            currentRobot.selected = true;
                        }
                        break;
                    case 'move':
                        if (currentRobot == null) {
                            state = 'INVALID_MOVE';
                            details = 'You have to select a robot before move';
                            break;
                        }
                        var nexts = this.getNextPositionsFrom(P, currentRobot.line, currentRobot.column);
                        if (this.isAmong({l: proposition[i].line, c: proposition[i].column}, nexts)) {
                            currentRobot.line = proposition[i].line;
                            currentRobot.column = proposition[i].column;
                        } else {
                            state = 'INVALID_MOVE';
                            details = 'Robot must move along a column or a line until it meet another robot or a wall.';
                        }
                        break;
                    default:
                        var details = 'Invalide command at index ' + i + ' of the proposition : ' + proposition[i].command + "\n\tShould be 'select' or 'move' as a value of 'command' attribute.";
                        throw new Error({error: 'INVALID_SUBCOMMAND', detail: details});
                }
            }
            if (currentRobot == null) {
                state = 'INVALID_EMPTY';
                details = 'A proposition can not be empty';
            }
            if (state == '') { // Proposition is valid. If incomplete then send back next possible movement for last selected robot
                // console.log("Cible et robot");
                // console.log("\t"+currentRobot.color+' == '+this.cibles[ this.cible ].t);
                // console.log("\t"+currentRobot.line  == this.cibles[ this.cible ].l
                // console.log("\t"+
                if (currentRobot.color == this.cibles[ this.cible ].t
                    && currentRobot.line == this.cibles[ this.cible ].l
                    && currentRobot.column == this.cibles[ this.cible ].c) {
                    state = 'SUCCESS';

                } else {
                    state = 'INCOMPLETE';
                    nextPositions = this.getNextPositionsFrom(P, currentRobot.line, currentRobot.column);
                }
            }
            return {state: state, details: details, nextPositions: nextPositions};
        }
    };
};

