let Utils = require('./utils');
let Path = require('./path');
let SocGames = require('./socgames');
const fs = require('fs'); // module pour gérer les fichiers
var Soc = function (game, options) {

    this.game = game;
    this.options = options;

    this.games = new SocGames();
    this.selectedGameID = 1;
    this.rules = this.games.getRules(this.selectedGameID);
    this.world = this.games.getWorld(this.selectedGameID);

    this.utils = new Utils();

    this.currentTurn = {
        turn: 1,
        player: 0,
        phase: "SPECIAL_TURN",
        dice1: 0,
        dice2: 0,
    };
    this.playerCount = 0;
    this.devCardStub = [];
    this.trades = {};
    this.currentStrongestKnight = {
        player: { username: "", index: -1},
        strength: 0,
        turn: 0
    };
    this.currentLongestRoad = {
        player: { username: "", index: -1},
        strength: 0,
        turn: 0
    };
    this.currentAction = {
        turn: this.currentTurn.turn,
        from: "GAME",
        to: this.game.players[this.currentTurn.player],
        todo: this.rules.specialTurns[0].toPlace[0]
    };
    this.startTime;
  
    this.players = [];
    this.init = function(beginningPlayers) {
        // init Players
        this.playerCount = beginningPlayers.length;
        for(var p = 0; p < beginningPlayers.length; p++) {
            this.players[beginningPlayers[p].username] = {
                index: p, 
                username: beginningPlayers[p].username,
                pieces: {
                    road:       this.rules.pieces.road,
                    settlement: this.rules.pieces.settlement,
                    city:       this.rules.pieces.city,
                    boat:       this.rules.pieces.boat,
                    citywalls:  this.rules.pieces.citywalls
                },
                score: 0,
                resources: { bricks: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
                resourceCount: 0,
                resourcesToReturn: { bricks: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
                resourceToReturnCount: 0,
                resourceLimit: this.rules.resourceLimit,
                trades: [], yearOfPlentyChoosenCards: [], monopoly: "",
                exchange: {
                    given: { bricks: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
                    demanded: { bricks: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
                },
                longestRoad: 0,
                resourceTradeCoef: { bricks: 4, lumber: 4, wool: 4, grain: 4, ore: 4 },
                devCards: {
                    tradedInthisTurn: {
                        knight: 0, victoryPoint: 0, 
                        roadBuilding: 0, monopoly: 0, yearOfPlenty: 0
                    },
                    toPlay: {
                        knight: 0, victoryPoint: 0, 
                        roadBuilding: 0, monopoly: 0, yearOfPlenty: 0
                    },
                    played: {
                        knight: 0, victoryPoint: 0, 
                        roadBuilding: 0, monopoly: 0, yearOfPlenty: 0
                    },
                    playedThisTurnCount: 0
                },
                opts: {
                    showPossibleBuilds: true,
                    mycolor: -1
                }
            };
            // Calcul nodes from tiles
            this.log("Set playerData for " +  beginningPlayers[p].username + "=>" + this.players[beginningPlayers[p].username].pieces.road + " roads...");// LOG
            this.log("Building nodes... (" + this.world.tiles.length + ")");// LOG
      
            this.shuffleTiles();

            for (var t=0; t<this.world.tiles.length; t++) {
                var tile = this.world.tiles[t];
                if (tile.type == "SEA") continue;
                for (var dx = -1; dx < 2; dx = dx + 2) {
                    for (var dy=-1; dy<2; dy++) {
                        var _i = tile.x + dx, _j = tile.y + dy;
            
                        var node = this.world.nodes.find( function( ele ) { 
                            return ele.i === _i && ele.j === _j;
                        });
                        if (node) {// the node exists
                            var neighbouringTile = node.tiles.find( function( ele ) { 
                            return ele.x === tile.x && ele.y === tile.y;
                            });
                            if (neighbouringTile) {// the tile exists
                            //this.log("neighbouringTile exists: " + neighbouringTile.x + ", " + neighbouringTile.y);// LOG
                            }
                            else {// the tile doesn't exist
                            node.tiles.push({
                                x: tile.x, 
                                y: tile.y
                            });
                            }
                        } 
                        else {// the node does'nt exist => add node with first neighbouring tile
                            this.world.nodes.push({
                                i: _i, j: _j,
                                tiles: [{
                                    x: tile.x, 
                                    y: tile.y
                                }],
                                build: { 
                                    type: 0, 
                                    player: { index: -1, username: "" },
                                    connected: false 
                                },
                                knight: { 
                                    force: 0, 
                                    player: -1 , 
                                    active: false 
                                },
                                harbor: { type: "no", tradeCoef: 4}
                            });
                        }
                    }
                }
            }
            this.log("Nodes built " + this.world.nodes.length);// LOG
            /*fs.writeFile('nodes.json', JSON.stringify(this.world.nodes, null, 2), (err) => { // création ou écrasement du fichier "fichier.txt" avec le contenu "data"
                if (err) throw err;
                console.log('Le fichier a été écrit avec succès !');
              });
            */
            // place harbors
            var seasWithHarbors = this.world.tiles.filter(tile => tile.type == "SEA" && tile.harbor != "no");
            seasWithHarbors.forEach(tile => this.placeHarbors(tile));

            // Calcul roads from nodes
            // TODO:
            // Init DevCard Stub
            for (var key in this.rules.devCardStub) {
                var count = this.rules.devCardStub[key];
                for (var i = 0; i < count; i++)
                    this.devCardStub.push(key);
            }
            this.log("w/"+ this.game.id + " DevCard Stub: " + this.devCardStub);// LOG
            this.shuffleArray(this.devCardStub);
            this.log("w/"+ this.game.id + " DevCard Stub: " + this.devCardStub);// LOG
        }
    };

    this.placeHarbors = function (tile) {
        tile.nodes.forEach(node => this.placeHarbor(node.x, node.y, tile.tradeCoef));
    } 
    this.placeHarbor = function (i, j, harbor) {
        var node = this.world.nodes.find(function (ele) {
            return ele.i === i && ele.j === j;
        });
        if (node) // the node exists
            node.harbor = harbor;
    };
    this.shuffleArray = function(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    };

    this.shuffleTiles = function() {
        var tiles = this.world.tiles;
        for (var n=0; n<1000; n++) {
            var i = Math.floor(Math.random() * tiles.length);
            var j = Math.floor(Math.random() * tiles.length);
            type_i = tiles[i].type;
            type_j = tiles[j].type;
            if (type_i != 'SEA' && type_j != 'SEA' && type_i != type_j) {
                tiles[i].type = type_j;
                tiles[j].type = type_i;
            }
            if (tiles[i].type == 'DESERT') {
                tiles[j].value = tiles[i].value;
                tiles[i].value = 0;
                this.world.robber = { x: tiles[i].x, y: tiles[i].y };
            }
            else if (tiles[j].type == 'DESERT') {
                tiles[i].value = tiles[j].value;
                tiles[j].value = 0;
                this.world.robber = { x: tiles[j].x, y: tiles[j].y };
            }
        }
    };

    /** Can place road in special turn?
    * obj: String "road", "settlement", "city", "boat", "knight", "cityWalls"
    * player: Player
    * road: Road
    * return: Boolean
    * */ 
    this.canPlaceRoad = function(player, road) {
        this.log("w/"+ this.game.id + " Can the road be placed?");// LOG
        // SPECIAL TURN
        if (this.isSpecialTurn()) {
            this.log("w/"+ this.game.id + " Can the road be placed in this special turn?");// LOG
            var isolatedBuild = this.world.nodes.find( function( ele ) { 
                return ele.build.player.index == player.index && !ele.build.connected;
            });
            if (isolatedBuild) {
                this.log("w/"+ this.game.id + " We found the build to connect this road.");// LOG
                if ((road.nodes[0].i == isolatedBuild.i && road.nodes[0].j == isolatedBuild.j)
                    || (road.nodes[1].i == isolatedBuild.i && road.nodes[1].j == isolatedBuild.j))
                {
                    isolatedBuild.build.connected = true;
                    return true;
                }
            }
        }
        // NORMAL TURN
        else { // NEVER CALL
            this.log("w/"+ this.game.id + " Can the road be placed in this normal turn?");// LOG
            return this.canPlaceRoadInNormalTurn(player, road);
        }
        return false;
    };
    /** Can place settlement or city in special turn?
    * player: Player (not used)
    * node: Node
    * return: Boolean
    * */
    this.canPlaceSettlementOrCityInSpecialTurn = function(player, node) {
        this.log("w/"+ this.game.id + " Can place settlement or city in special turn?" );// LOG
        //this.log("build.type ", node.build.type);// LOG
        //this.log("build.player ", node.build.player);// LOG
        //this.log("knight.force ", node.knight.force);// LOG
        // check if not other build or other owner or knight
        if (node.build.type != 0 || node.build.player.index != -1 || node.knight.force != 0)
            return false;
        // check neighbours
        return this.utils.allNeighboursAreFree(this.world, node);
    };

    /** Can place road in normal turn ?
    * player: Player
    * userData: Road
    * return: Boolean
    * */
    this.canPlaceRoadInNormalTurn = function(player, userData) {
        this.log("w/"+ this.game.id + " Can " + player.username + " place road in normal turn?");// LOG
        for(var r=0; r<this.world.roads.length; r++) {
            var otherRoad = this.world.roads[r];
            this.log("w/"+ this.game.id + " Other road ID " + otherRoad.id);// LOG
            this.log("w/"+ this.game.id + " OtherRoad.player.index " + otherRoad.player.index);// LOG
            this.log("w/"+ this.game.id + " OtherRoad.player " + otherRoad.player);// LOG
            if (otherRoad.player.index == player.index && this.utils.isAdjacentRoad(otherRoad, userData)) {
                this.log("w/"+ this.game.id + "YES" );// LOG
                return true;
            }
        }
    };

    /** Can place settlement in normal turn?
    * player: Player (not used)
    * node: Node
    * return: Boolean
    * */
    this.canPlaceSettlementInNormalTurn = function(player, node) {
        this.log("w/"+ this.game.id + " Can " + player.username + " place settlement in normal turn?");// LOG
        //this.log("build.type ", node.build.type);// LOG
        //this.log("build.player ", node.build.player);// LOG
        //this.log("knight.force ", node.knight.force);// LOG
        return this.utils.canPlaceSettlementInNormalTurn(this.world, player, node);
    };
    /** Can place settlement in normal turn?
    * player: Player (not used)
    * node: Node
    * return: Boolean
    * */
    this.canPlaceCityInNormalTurn = function(player, node) {
        this.log("w/"+ this.game.id + " Can " + player.username + " place city in normal turn?");// LOG
        return node.build.player.index == player.index && node.build.type == 1; 
    };

    /** Can pay?
    * obj: []
    * username: string
    * return: Boolean
    * */
    this.canPay = function(obj, username) {
        this.log("w/"+ this.game.id + " " + username + "  has " + JSON.stringify(this.players[username].resources));// LOG
        for(var key in obj)
            if (this.players[username].resources[key] < obj[key]) return false;
        this.log("w/"+ this.game.id + " " + username + "  can buy " + JSON.stringify(obj));// LOG
        return true;
    };
    /** Can buy?
    * obj: string "road", "settlement", "city", "devCard", "boat", "knight", "cityWalls"
    * username: string
    * return: Boolean
    * */
    this.canBuy = function(obj, username) {
        for(var key in this.rules.costs[obj])
            if (this.players[username].resources[key] < this.rules.costs[obj][key])  return false;
        return true;
    };
    /** Can move rober on */
    this.canMoveRobberOn = function (data) {
        if (data.x == this.world.robber.x && data.y == this.world.robber.y) return false;
        if (data.type == "SEA") return false;
        return true;
    };
    /** can Play?
    * username: string
    * userAction: objj
    * useraData: obj
    * return: Boolean
    * */
    this.canPlay = function (username, userAction, userData) {
        /*
        data: {
            type: tg._type,
            data: tg._data
        }*/
        this.log("Can '" + username + "' play? (" + userAction.todo + ")");// LOG

        if (userAction.turn != this.currentAction.turn) {
            this.log("And no, " + username + ", you can't (no good turn).");// LOG
            return false;
        }

        var player = this.players[username];
        // THIEF ?
        if (this.currentAction.todo == "THIEF" && userAction.todo == "SEND_RSRC_TO_BANK" && userAction.turn == this.currentAction.turn) {
            return true;
        }
        // TRADE WITH PLAYERS
        if (userAction.todo == 'OFFER_EXCHANGE') {
            this.log("userAction: " + JSON.stringify(userAction));// LOG
            return this.currentTurn.phase == 'TRADING' && this.canPay(userAction.offer.given, userAction.from);
        }
        else if (userAction.todo == 'ACCEPT_EXCHANGE') {
            this.log("userAction: " + JSON.stringify(userAction));// LOG
            return this.currentTurn.phase == 'TRADING' && this.canPay(userAction.trade.offer.demanded, userAction.from);
        }
        else if (userAction.todo == "REFUSE_EXCHANGE") {
            return this.currentTurn.phase == 'TRADING';
        }
        else if (userAction.todo == "CONFIRME_EXCHANGE") {
            this.log("userAction: " + JSON.stringify(userAction));// LOG
            return this.currentTurn.phase == 'TRADING' && this.canPay(userAction.trade.offer.given, userAction.from);
        }
        if (username != this.currentAction.to.username) {
            this.log("And no, " + username + ", you can't.");// LOG
            return false;
        }
        // ACTION FOR CURRENT PLAYER: SPECIAL & NORMAL TURN
        // SPECIAL TURN
        if (this.isSpecialTurn()) {
            this.log("w/" + this.game.id + " SPECIAL TURN");// LOG
            if (userAction.todo != this.currentAction.todo) {
                this.log("And no, " + username + ", you can't.");// LOG
                return false;
            }
            switch (userAction.todo) {
                case "SETTLEMENT":
                case "CITY":
                    if (userData.type != "node") return false;
                    var choosenNode = this.world.nodes.find(function (ele) {
                        return ele.i === userData.data.i && ele.j === userData.data.j;
                    });
                    if (choosenNode) {// we found the node selected by the player
                        this.log("w/" + this.game.id + " We found the node selected by the player " + choosenNode);// LOG
                        if (this.canPlaceSettlementOrCityInSpecialTurn(player, choosenNode)) {
                            this.log("w/" + this.game.id + "And we can place it!");// LOG
                            // update model -> world -> nodes
                            choosenNode.build.type = 1;
                            choosenNode.build.player.index = player.index;
                            choosenNode.build.player.username = username;
                            if (choosenNode.harbor.type != "no") this.changePlayerTradeCoefs(player, choosenNode);
                            var specialTurnRule = this.rules.specialTurns[userAction.turn - 1]
                            if (specialTurnRule.harvest) {
                                for (var t = 0; t < choosenNode.tiles.length; t++) {
                                    var tile = this.world.tiles.find(function (ele) {
                                        return ele.x === choosenNode.tiles[t].x && ele.y === choosenNode.tiles[t].y;
                                    });
                                    if (tile) { // a matched tile pour this player
                                        var value = 0;
                                        if (userAction.todo == "SETTLEMENT") value = this.rules.harvest.settlement; else if (userAction.todo == "CITY") value = this.rules.harvest.city;
                                        this.log("w/" + this.game.id + " Tile for haverst found: " + tile.type + " -> " + value);// LOG
                                        this.harvest(player, tile, value);
                                    }
                                }
                            }
                            return true;
                        }
                        this.log("w/" + this.game.id + " Ho! We can't!");// LOG
                    }
                    return false;
                case "ROAD":
                    if (userData.type != "road") return false;
                    var choosenRoad = this.world.roads.find(function (ele) {
                        return ele.nodes[0].i === userData.data.nodes[0].i && ele.nodes[0].j === userData.data.nodes[0].j
                            && ele.nodes[1].i === userData.data.nodes[1].i && ele.nodes[1].j === userData.data.nodes[1].j;
                    });
                    if (choosenRoad) {// we found the road selected by the player
                        this.log("w/" + this.game.id + " We found the road selected by the player.");// LOG
                        if (this.canPlaceRoad(player, choosenRoad)) {
                            // Update model -> world -> roads
                            choosenRoad.player.index = player.index;
                            choosenRoad.player.username = username;
                            // Add road to dictionary :
                            // => If player hasn't' path then add new path 
                            if (this.world.playerroads[username] == null)
                                this.world.playerroads[username] = new Path();
                            this.world.playerroads[username].addRoad(choosenRoad);
 
                            this.log("w/" + this.game.id + " Roads for " + username + ":");// LOG
                            this.log(JSON.stringify(this.world.playerroads[username], null, 2));// LOG
                            return true;
                        }
                    }
                    return false;
            }
        }
        // NORMAL TURN
        else {
            this.log("w/" + this.game.id + " NORMAL TURN");// LOG
            this.log("w/" + this.game.id + " this.currentTurn.phase: " + this.currentTurn.phase);// LOG
            this.log("w/" + this.game.id + " this.currentAction.todo: " + this.currentAction.todo);// LOG
            this.log("w/" + this.game.id + " userAction.todo: " + userAction.todo);// LOG
            switch (userAction.todo) {
                case "PLAY_KNIGHT":
                    return (this.currentTurn.phase == "ROLL_DICE" || this.currentTurn.phase == "TRADING" || this.currentTurn.phase == "BUILDING")
                        && player.devCards.toPlay.knight > 0 && player.devCards.playedThisTurnCount < this.rules.maxDevCardByTurn;
                case "ROLL_DICE":
                    return this.currentTurn.phase == "ROLL_DICE" && this.currentAction.todo == "ROLL_DICE";
                case "MOVE_ROBBER": return this.currentAction.todo == "MOVE_ROBBER" && this.canMoveRobberOn(userData.data);
                case "TRADE_RSRC_WITH_BANK": return this.currentTurn.phase == "TRADING" && userAction.trades.length > 0;
                case "END_TRADING": return this.currentTurn.phase == "TRADING" && this.currentAction.todo == 'PLAY'; /* PLAY */
                case "BUY_ROAD":
                    return this.currentTurn.phase == "BUILDING" && this.currentAction.todo == 'PLAY' /* PLAY */
                        && player.pieces.road > 0 && this.canBuy("road", username) && this.canPlaceRoadInNormalTurn(player, userData.data);
                case "BUY_SETTLEMENT":
                    return this.currentTurn.phase == "BUILDING" && this.currentAction.todo == 'PLAY' /* PLAY */
                        && player.pieces.settlement > 0 && this.canBuy("settlement", username) && this.canPlaceSettlementInNormalTurn(player, userData.data);
                case "BUY_CITY":
                    return this.currentTurn.phase == "BUILDING" && this.currentAction.todo == 'PLAY' /* PLAY */
                        && player.pieces.city > 0 && this.canBuy("city", username) && this.canPlaceCityInNormalTurn(player, userData.data);
                case "BUY_DEV_CARD":
                    return this.currentTurn.phase == "BUILDING" && this.currentAction.todo == 'PLAY' /* PLAY */
                        && this.canBuy("devCard", username);
                case "PLAY_VICTORY_POINT":
                    return player.devCards.toPlay.victoryPoint > 0 && player.devCards.playedThisTurnCount < this.rules.maxDevCardByTurn;
                case "PLAY_ROAD_BUILDING":
                    return player.devCards.toPlay.roadBuilding > 0 && player.devCards.playedThisTurnCount < this.rules.maxDevCardByTurn;
                case "PLAY_MONOPOLY":
                    return player.devCards.toPlay.monopoly > 0 && player.devCards.playedThisTurnCount < this.rules.maxDevCardByTurn;
                case "PLAY_YEAR_OF_PLENTY":
                    return player.devCards.toPlay.yearOfPlenty > 0 && player.devCards.playedThisTurnCount < this.rules.maxDevCardByTurn;
                case "SPECIAL_ROAD_1":
                case "SPECIAL_ROAD_2":
                    return this.currentAction.todo == userAction.todo && this.canPlaceRoadInNormalTurn(player, userData.data);
                case "SEND_CHOOSEN_CARDS_OF_YEAR_OF_PLENTY": return this.currentAction.todo == "CHOOSE_YEAR_OF_PLENTY";
                case "SEND_CHOOSEN_RESOURCE_OF_MONOPOLY": return this.currentAction.todo == "CHOOSE_MONOPOLY";
                case "END_TURN": return this.currentTurn.phase == "BUILDING";
                default: return false;
            }
        }
        return false;
    };
  
    /** Play
    * username: string
    * userAction: obj
    * userData: obj
    * */
    this.play = function (username, userAction, userData) {
        this.log("w/" + this.game.id + " '" + username + "' is playing " + userAction.todo);// LOG
        var player = this.players[username];
        // SPECIAL TURN
        if (this.isSpecialTurn()) {
            if (userAction.todo == "ROAD") { this.players[username].pieces.road--; }// The road has been placed in the function canPlay()
            else if (userAction.todo == "SETTLEMENT") { this.players[username].pieces.settlement--; }// The settlement has been placed in the function canPlay()
            else if (userAction.todo == "CITY") { this.players[username].pieces.city--; }// The city has been placed in the function canPlay()
            this.log("w/" + this.game.id + " '" + username + "' place " + userAction.todo + " at " + userData.data.i + "," + userData.data.j);// LOG
            var turn = this.currentTurn.turn;
            var specialTurnRule = this.rules.specialTurns[turn - 1];
            var currentActionFound = false;
            var t = 0;
            for (t; t < specialTurnRule.toPlace.length; t++) {
                if (this.currentAction.todo == specialTurnRule.toPlace[t]) {
                    // current action found
                    this.log("w/" + this.game.id + " Current action found: " + this.currentAction.todo);// LOG
                    currentActionFound = true;
                    break;
                }
            }
            if (currentActionFound) {
                // End of special turn for this user ?
                if (t == specialTurnRule.toPlace.length - 1) {
                    // YES
                    this.log("w/" + this.game.id + " End of special turn? => YES");// LOG
                    // Is a next player exist for this turn?
                    var nextPlayerIndex = this.currentTurn.player + specialTurnRule.sens;
                    if (nextPlayerIndex == -1 || nextPlayerIndex == this.playerCount) {
                        this.log("w/" + this.game.id + " No next player for this run => nextTurn");// LOG
                        this.currentTurn.turn++;
                        this.currentAction.turn = this.currentTurn.turn;
                        // no need change player
                        // Is the next turn special?
                        if (this.isSpecialTurn()) {
                            this.currentAction.todo = specialTurnRule.toPlace[0];
                        }
                        else {
                            this.currentTurn.phase = this.rules.normalTurn[0];
                            this.currentAction.todo = "ROLL_DICE";
                        }
                    }
                    else {
                        this.log("w/" + this.game.id + " There is a next player for this run => nextPlayer");// LOG
                        this.currentTurn.player = this.currentTurn.player + specialTurnRule.sens;
                        this.currentAction.todo = specialTurnRule.toPlace[0];
                        for (var key in this.players) {
                            this.log("w/" + this.game.id + " key => " + key + "(TODO: do a function)");// LOG
                            if (this.players[key].index == this.currentTurn.player) {
                                this.currentAction.to = this.players[key];
                                break;
                            }
                        }
                    }
                }
                else {
                    // NO => no change player, just set next action 
                    this.log("w/" + this.game.id + " End of special turn? => NO");// LOG
                    this.currentAction.todo = specialTurnRule.toPlace[t + 1];
                    this.log("w/" + this.game.id + " Next todo for " + username + " => " + this.currentAction.todo);// LOG
                }
            }
        }
        // NORMAL TURN
        else {
            this.log("w/" + this.game.id + " this.currentAction.todo = " + this.currentAction.todo);// LOG
            if (this.currentAction.todo == 'THIEF' && userAction.todo == 'SEND_RSRC_TO_BANK') {
                player.resourcesToReturn = userAction.resourcesToReturn;
                this.log("w/" + this.game.id + " " + username + " with rsrc " + JSON.stringify(player.resources));// LOG
                this.log("w/" + this.game.id + " " + username + " send rsrc " + JSON.stringify(player.resourcesToReturn));// LOG
                for (var rsc in player.resourcesToReturn) {
                    var count = player.resourcesToReturn[rsc];
                    player.resources[rsc] = player.resources[rsc] - count;
                    player.resourcesToReturn[rsc] = 0;
                    player.resourceCount = player.resourceCount - count;
                    player.resourceToReturnCount = player.resourceToReturnCount - count;
                    if (player.resourceToReturnCount == 0) break; // in case where the plaayer sended too rsrc
                }
                player.resourceToReturnCount = 0;
                this.log("w/" + this.game.id + " " + username + " has rsrc  " + JSON.stringify(player.resources));// LOG
                // check if other player have to send resources
                var canContinue = true;
                for (var usr in this.players) {
                    if (this.players[usr].resourceToReturnCount > 0) {
                        canContinue = false;
                        break;
                    }
                }
                if (canContinue) this.currentAction.todo = 'MOVE_ROBBER';
            }
            else if (this.currentAction.todo == 'CHOOSE_YEAR_OF_PLENTY' && userAction.todo == 'SEND_CHOOSEN_CARDS_OF_YEAR_OF_PLENTY') {
                this.addChoosenResources(player, userAction.yearOfPlentyChoosenCards);
                this.currentAction.todo = 'PLAY';
            }
            else if (this.currentAction.todo == 'CHOOSE_MONOPOLY' && userAction.todo == 'SEND_CHOOSEN_RESOURCE_OF_MONOPOLY') {
                this.playMonopoly(player, userAction.monopolyChoosenResource);
                this.currentAction.todo = 'PLAY';
                this.log("w/" + this.game.id + " " + username + " MONOPOLY:  +" + userAction.monopolyChoosenResource);// LOG
            }
            else {
                switch (userAction.todo) {
                    case "ROLL_DICE":
                        this.currentTurn.dice1 = 1 + Math.floor(Math.random() * 6);
                        this.currentTurn.dice2 = 1 + Math.floor(Math.random() * 6);
                        var dice = this.currentTurn.dice1 + this.currentTurn.dice2;
                        this.currentAction.todo = 'PLAY';
                        this.currentTurn.phase = this.rules.normalTurn[1];
                        if (dice == 7) {
                            this.currentAction.todo = 'MOVE_ROBBER';
                            // THIEF
                            this.log("w/" + this.game.id + " THIEF.");// LOG
                            // Calculate resourceToReturnCount for each player
                            for (var key in this.players) {
                                var _player = this.players[key];
                                this.log("w/" + this.game.id + " " + _player.username + " (" + _player.resourceCount + ">" + _player.resourceLimit + ")");// LOG
                                _player.resourceToReturnCount = 0;
                                if (_player.resourceCount > _player.resourceLimit) {
                                    _player.resourceToReturnCount = Math.floor(_player.resourceCount / 2);
                                    this.currentAction.todo = 'THIEF';
                                }
                                this.log("w/" + this.game.id + " " + _player.username + " resourceToReturnCount:" + _player.resourceToReturnCount);
                            }
                        }
                        else {
                            // HARVEST
                            this.harvestAll(dice);
                        }
                        break;
                    case "MOVE_ROBBER":
                        if (userAction.todo == 'MOVE_ROBBER') {
                            this.log("w/" + this.game.id + " New position for robber: " + JSON.stringify(userData));// LOG
                            this.world.robber.x = userData.data.x;
                            this.world.robber.y = userData.data.y;
                            this.currentAction.todo = 'PLAY';
                            if (this.currentTurn.phase == "ROLL_DICE") this.currentAction.todo = 'ROLL_DICE';
                            // Pickup or not pickup
                            var otherPlayers = this.getOthersPlayersOnTile(this.players[username].index, userData.data);
                            this.log("w/" + this.game.id + " Players available to pickup " + JSON.stringify(otherPlayers));// LOG
                            if (otherPlayers.length == 1)
                                this.pickup(this.players[username], otherPlayers[0]);
                            else if (otherPlayers.length > 1)
                                this.currentAction.todo = 'CHOOSE_PLAYER_FOR_PICKUP';
                        }
                        break;
                    case "SPECIAL_ROAD_1":
                        this.place("road", username, userData);
                        this.currentAction.todo = 'SPECIAL_ROAD_2';
                        break;
                    case "SPECIAL_ROAD_2":
                        this.place("road", username, userData);
                        this.currentAction.todo = 'PLAY';
                        break;
                    //
                    case "TRADE_RSRC_WITH_BANK":
                        for (var t = 0; t < userAction.trades.length; t++) {
                            var toRemove = userAction.trades[t].toRemove;
                            var toAdd = userAction.trades[t].toAdd;
                            var count = userAction.trades[t].count;
                            if (player.resourceTradeCoef[toRemove] == count
                                && player.resources[toRemove] >= count) {
                                player.resources[toRemove] = player.resources[toRemove] - count;
                                player.resources[toAdd]++;
                                player.resourceCount = player.resourceCount - count + 1;
                            }
                        }
                        // TODO: save player trades in historic?
                        player.trades = [];
                        break;

                    case "OFFER_EXCHANGE":
                        this.log("OFFER_EXCHANGE : " + JSON.stringify(userAction.offer));
                        //if (username != this.currentAction.to.username)
                        var trade = {
                            id: "Trade_" + (Math.random() + 1).toString(36).slice(2, 18),
                            turn: this.currentTurn.turn,
                            from: userAction.from,
                            offer: userAction.offer
                        }
                        this.trades[trade.id] = trade;
                        this.log(JSON.stringify(trade));
                        this.log(JSON.stringify(this.trades));
                        break;
                    case "ACCEPT_EXCHANGE":
                        this.log("ACCEPT_EXCHANGE : " + JSON.stringify(userAction.trade));
                        var trade = this.trades[userAction.trade.id];
                        if (trade) {
                            trade.offer.acceptedBy[userAction.from] = Date.now();
                            this.log(JSON.stringify(trade));
                        }
                        this.log(JSON.stringify(this.trades));
                        break;
                    case "REFUSE_EXCHANGE":
                        this.log("ACCEPT_EXCHANGE : " + JSON.stringify(userAction.trade));
                        var trade = this.trades[userAction.trade.id];
                        if (trade) {
                            trade.offer.refusedBy[userAction.from] = Date.now();
                            // If everybody refused offer, delete it
                            if (Object.keys(trade.offer.refusedBy).length == this.playerCount - 1) delete this.trades[userAction.trade.id]
                            this.log(JSON.stringify(trade));
                        }
                        this.log(JSON.stringify(this.trades));
                        break;
                    case "CONFIRME_EXCHANGE":
                        this.log("CONFIRME_EXCHANGE : " + JSON.stringify(userAction.trade));
                        var trade = this.trades[userAction.trade.id];
                        if (trade) {
                            // Finalize the trade
                            var _from = this.players[userAction.from];
                            var _to = this.players[userAction.to];
                            for (var rsc in trade.offer.given) {
                                var count = trade.offer.given[rsc];
                                _from.resources[rsc] = _from.resources[rsc] - count;
                                _from.resourceCount = _from.resourceCount - count;
                                _to.resources[rsc] = _to.resources[rsc] + count;
                                _to.resourceCount = _to.resourceCount + count;
                            }
                            for (var rsc in trade.offer.demanded) {
                                var count = trade.offer.demanded[rsc];
                                _from.resources[rsc] = _from.resources[rsc] + count;
                                _from.resourceCount = _from.resourceCount + count;
                                _to.resources[rsc] = _to.resources[rsc] - count;
                                _to.resourceCount = _to.resourceCount - count;
                            }
                            // And delete it
                            delete this.trades[userAction.trade.id]
                            this.log(JSON.stringify(trade));
                        }
                        this.log(JSON.stringify(this.trades));
                        break;
                    case "END_TRADING":
                        this.trades = {}; // Reset trades (TODO: transfert to history)
                        this.currentTurn.phase = this.rules.normalTurn[2]; // Next phase of normal turn
                        this.log("w/" + this.game.id + " this.currentTurn.phase = " + this.currentTurn.phase);// LOG
                        break;
                    case "BUY_ROAD":
                        this.buy("road", username);
                        this.place("road", username, userData);
                        var winner = this.getWinner();
                        if (winner) this.endGame(winner);
                        break;
                    case "BUY_SETTLEMENT":
                        this.buy("settlement", username);
                        this.place("settlement", username, userData);
                        var winner = this.getWinner();
                        if (winner) this.endGame(winner);
                        break;
                    case "BUY_CITY":
                        this.buy("city", username);
                        this.place("city", username, userData);
                        var winner = this.getWinner();
                        if (winner) this.endGame(winner);
                        break;
                    case "BUY_DEV_CARD":
                        var devCard = this.devCardStub.pop();
                        if (devCard) {
                            this.buy("devCard", username);
                            this.players[username].devCards.tradedInthisTurn[devCard]++;
                            if (devCard == "victoryPoint") {
                                // Check if player wins the game with this point
                                // TODO:
                            }
                        }
                        break;
                    case "PLAY_KNIGHT":
                        this.players[username].devCards.toPlay.knight--; this.players[username].devCards.played.knight++;
                        // Move robber if no winner
                        var winner = this.getWinner();
                        if (winner)
                            this.endGame(winner);
                        else
                            this.currentAction.todo = 'MOVE_ROBBER';
                        this.players[username].devCards.playedThisTurnCount++;
                        break;
                    case "PLAY_VICTORY_POINT":
                        this.players[username].devCards.toPlay.victoryPoint--; this.players[username].devCards.played.victoryPoint++;
                        this.players[username].devCards.playedThisTurnCount++;
                        break;
                    case "PLAY_ROAD_BUILDING":
                        this.players[username].devCards.toPlay.roadBuilding--; this.players[username].devCards.played.roadBuilding++;
                        this.players[username].devCards.playedThisTurnCount++;
                        this.currentAction.todo = 'SPECIAL_ROAD_1';
                        break;
                    case "PLAY_YEAR_OF_PLENTY":
                        this.players[username].devCards.toPlay.yearOfPlenty--; this.players[username].devCards.played.yearOfPlenty++;
                        this.players[username].devCards.playedThisTurnCount++;
                        this.currentAction.todo = 'CHOOSE_YEAR_OF_PLENTY';
                        break;
                    case "PLAY_MONOPOLY":
                        this.players[username].devCards.toPlay.monopoly--; this.players[username].devCards.played.monopoly++;
                        this.players[username].devCards.playedThisTurnCount++;
                        this.currentAction.todo = 'CHOOSE_MONOPOLY';
                        break;
                    case "END_TURN":
                    default:
                        // transfert tradedInthisTurn Cards to toPlay Cards
                        this.acquireDevCard(this.players[username]);
                        this.nextPlayer();
                        this.currentTurn.phase = this.rules.normalTurn[0]; // ROLL_DICE
                        this.currentAction.todo = "ROLL_DICE";
                }
            }
        }
        this.calculateLongestRoadOfPlayers();
        this.updatePlayersScore();
        this.currentAction.turn = this.currentTurn.turn;
    };

    this.harvestAll = function (dice) {
        this.log("w/" + this.game.id + " HARVEST for dice result: " + dice);// LOG
        for (var key in this.players) {
            var _player = this.players[key];
            this.log("w/" + this.game.id + " HARVEST of: " + _player.username + ' (' + _player.index + ')');// LOG
            for (var n = 0; n < this.world.nodes.length; n++) { // loop over all nodes
                var node = this.world.nodes[n];
                if (node.build.type == 0 || node.build.player.index != _player.index) continue; // if no build ot not mine continue
                this.log("w/" + this.game.id + " HARVEST for node: " + JSON.stringify(node));// LOG
                for (var t = 0; t < node.tiles.length; t++) {
                    var tile = this.world.tiles.find(function (ele) {
                        return ele.x === node.tiles[t].x && ele.y === node.tiles[t].y /*&& ele.value === dice*/; // TODO: check if tile is not stolen
                    });
                    if (tile) { // a matched tile pour this player and this value
                        if (tile.value == dice) {
                            this.log("w/" + this.game.id + " Tile for haverst found: " + tile.type + "-" + tile.value);// LOG
                            this.harvest(_player, tile, node.build.type);
                        }
                    }
                }
            }
        }
    };

    /** Harvest 
    * player: Player
    * tile: Tile
    * value: int
    * */  
    this.harvest = function(player, tile, value) {
        // No haverst if tile has the robber
        if (tile.x == this.world.robber.x && tile.y == this.world.robber.y) return;
        switch (tile.type) {
            case "FOREST":      player.resources.lumber = player.resources.lumber + value;  break;// lumber
            case "HILLS":       player.resources.bricks = player.resources.bricks + value;  break;// bricks
            case "PASTURE":     player.resources.wool = player.resources.wool + value;      break;// wool
            case "FIELDS":      player.resources.grain = player.resources.grain + value;    break;// grain
            case "MOUNTAINS":   player.resources.ore = player.resources.ore + value;        break;// ore
            default:
        }
        player.resourceCount = player.resources.lumber + player.resources.bricks + player.resources.wool + player.resources.grain + player.resources.ore;
    };

    this.getOthersPlayersOnTile = function (playerIndex, data) {
        this.log("w/" + this.game.id + " get OthersPlayersOnTile for playerIndex " + playerIndex);// LOG
        this.log("w/" + this.game.id + " on the tile " + JSON.stringify(data));// LOG
        var _otherPlayers = [];
        for (var n = 0; n < this.world.nodes.length; n++) {
            var node = this.world.nodes[n];
            if (node.build.type == 0 || node.build.player.index == playerIndex) continue; // no build or player's build
            // build on tile
            for (var t = 0; t < node.tiles.length; t++) {
                if (node.tiles[t].x == data.x && node.tiles[t].y == data.y) {
                    _otherPlayers[node.build.player.index] = true;
                    break;
                }
            }
        }
        var otherPlayers = [];
        for (var key in _otherPlayers)
            if (_otherPlayers[key] == true)
                otherPlayers.push(Math.floor(key));
        return otherPlayers;
    };

    /** Pickup resource card
    * to: Player
    * from: int
    */
    this.pickup = function (to, from) {
        this.log("w/" + this.game.id + " Pickup to " + to.index + " from " + from);// LOG
        if (to.index == from) return; // to=from! 
        var otherPlayer;
        for (var key in this.players) {
            otherPlayer = this.players[key];
            if (otherPlayer.index == from) break;// we found the other player
        }
        this.log("w/" + this.game.id + " cards of  " + otherPlayer.username + " : " + JSON.stringify(otherPlayer.resources));// LOG
        if (otherPlayer.resourceCount == 0) return; // no cards to pickup!
        var rscs = [];
        for (var r in otherPlayer.resources) {
            if (otherPlayer.resources[r] > 0) rscs.push(r); // get no empty resource
        }
        this.log("w/" + this.game.id + " cards of  " + otherPlayer.username + " : " + JSON.stringify(rscs));// LOG
        if (rscs.length > 0) {
            this.shuffleArray(rscs);
            var rsc = rscs[0];
            this.log("w/" + this.game.id + " " + to.username + " pickup " + rsc);// LOG
            // remove resource from
            otherPlayer.resources[rsc]--;
            otherPlayer.resourceCount--;
            // add resource to
            to.resources[rsc]++;
            to.resourceCount++;
        }
    };

    /** Special turn ?
    * return: Boolean
    */
    this.isSpecialTurn = function () {
        return this.currentTurn.turn <= this.rules.specialTurnCount;
    };

    /**  */
    this.acquireDevCard = function (player) {
        for (var rsc in player.devCards.tradedInthisTurn) {
            player.devCards.toPlay[rsc] = player.devCards.toPlay[rsc] + player.devCards.tradedInthisTurn[rsc];
            player.devCards.tradedInthisTurn[rsc] = 0;
        }
    };

    /** Next player in a normal turn */
    this.nextPlayer = function () {
        this.log("w/" + this.game.id + " Next player.");// LOG
        this.currentTurn.player++;
        if (this.currentTurn.player == this.playerCount) {
            this.currentTurn.player = 0;
            this.currentTurn.turn++;
        }
        for (var key in this.players) {
            this.log("w/" + this.game.id + " key => " + key + "(TODO: do a function)");// LOG
            if (this.players[key].index == this.currentTurn.player) {
                this.currentAction.to = this.players[key];
                this.players[key].devCards.playedThisTurnCount = 0;
                break;
            }
        }
        this.currentAction.turn = this.currentTurn.turn;
        this.currentAction.player = this.currentTurn.player;

        this.log("w/" + this.game.id + " " + this.currentAction.to.username + " is new player.");// LOG
    };

    /** */
    this.hasRobber = function (tile) {
        for (var t = 0; t < this.world.tiles.length; t++) {
            if (this.world.tiles[t].x == tile.x && this.world.tiles[t].y == tile.y)
                return tile.x == this.world.robber.x && tile.y == this.world.robber.y;
        }
    };

    this.adjacentRoads = function (roads, road) {
        var adjacentRoads = [];
        for (var r = 0; r < roads.length; r++) {
            var otherRoad = roads[r];
            if (this.utils.isAdjacentRoad(otherRoad, road)) adjacentRoads.push(otherRoad);
        }
        return adjacentRoads;
    };

    this.roadHasNext = function (roads, road) {
        for (var r = 0; r < roads.length; r++) {
            var otherRoad = roads[r];
            if (this.utils.isAdjacentRoad(otherRoad, road) && !otherRoad.alreadyCounted) return true;
        }
        return false;
    };

    this.getNextRoads = function (roads, road) {
        var nexts = [];
        for (var r = 0; r < roads.length; r++) {
            var otherRoad = roads[r];
            if (this.utils.isAdjacentRoad(otherRoad, road) && !otherRoad.alreadyCounted) nexts.push(otherRoad);
        }
        return nexts;
    };

    /** Buy
    * obj: string "road", "settlement", "city", "devCard", "boat", "knight", "cityWalls"
    * username: string
    * */
    this.buy = function(obj, username) {
        this.log("w/"+ this.game.id + " " + username + " buy " + obj + " in normal turn.");// LOG
        var player = this.players[username];
        for(var key in this.rules.costs[obj]) {
            var count = this.rules.costs[obj][key];
            player.resources[key] = player.resources[key] - count;
            player.resourceCount = player.resourceCount - count;
        }
    };

    /** Place
    * obj: string "road", "settlement", "city", "devCard", "boat", "knight", "cityWalls"
    * username: string
    * */
    this.place = function(obj, username, userData) {
        this.log("w/"+ this.game.id + " " + username + " place " + obj + " in normal turn. " + JSON.stringify(userData));// LOG
        switch (obj) {
            case "road":
                var choosenRoad = null;
                for (var r=0; r<this.world.roads.length; r++) {
                    var road = this.world.roads[r];
                    if (road.nodes[0].i === userData.data.nodes[0].i && road.nodes[0].j === userData.data.nodes[0].j
                        && road.nodes[1].i === userData.data.nodes[1].i && road.nodes[1].j === userData.data.nodes[1].j)
                        {
                            choosenRoad = road;
                            break;
                        }
                }
                if (choosenRoad) {
                    var player = this.players[username];
                    // update model -> world -> roads
                    choosenRoad.player.index = player.index;
                    choosenRoad.player.username = username;
                    player.pieces.road--;
                    for (var pr = 0; pr < this.world.playerroads[username].length; pr++) {
                        this.log("w/" + this.game.id + " Search in path number " + (pr + 1) + " for " + username);// LOG
                        if (this.world.playerroads[username][pr].addRoad(userData.data)) {
                            this.log("w/" + this.game.id + " Add to path number " + (pr + 1));// LOG
                            this.log("w/" + this.game.id + " Roads for " + username + ":");// LOG
                            this.log(JSON.stringify(this.world.playerroads[username], null, 2));// LOG
                            break;
                        }
                    }
                }
                break;
            case "settlement":
                var choosenNode = null;
                for (var n=0; n<this.world.nodes.length; n++) {
                    var node = this.world.nodes[n];
                    if (node.i == userData.data.i && node.j == userData.data.j) {
                        choosenNode = node;
                        break;
                    }
                }
                if (choosenNode) {
                    var player = this.players[username];
                    // update model -> world -> nodes -> build
                    choosenNode.build.type = 1;
                    choosenNode.build.player.index = player.index;
                    choosenNode.build.player.username = username;
                    player.pieces.settlement--;
                    if (choosenNode.harbor.type != "no") this.changePlayerTradeCoefs(player, choosenNode);
                }
                break;
            case "city":
                var choosenNode = null;
                for (var n=0; n<this.world.nodes.length; n++) {
                    var node = this.world.nodes[n];
                    if (node.i == userData.data.i && node.j == userData.data.j) {
                        choosenNode = node;
                        break;
                    }
                }
                if (choosenNode) {
                    var player = this.players[username];
                    // update model -> world -> nodes -> build
                    choosenNode.build.type = 2;
                    choosenNode.build.player.index = player.index;
                    choosenNode.build.player.username = username;
                    player.pieces.city--;
                    if (choosenNode.harbor.type != "no") this.changePlayerTradeCoefs(player, choosenNode);
                }
                break;
            default:
        }
    };

    this.addChoosenResources = function (player, resources) {
        for (var r = 0; r < Math.min(2, resources.length); r++) {
            this.log("w/" + this.game.id + " " + player.username + " YEAR_OF_PLENTY: " + resources[r]);// LOG
            player.resources[resources[r]]++;
            player.resourceCount++;
        }
        player.yearOfPlentyChoosenCards = [];
    };

    this.playMonopoly = function (player, choosenRsc) {
        this.log("w/" + this.game.id + " " + player.username + " MONOPOLY: " + choosenRsc);// LOG
        var sum = 0;
        for (var key in this.players) {
            var _player = this.players[key];
            if (_player.username == player.username) continue;
            var count = _player.resources[choosenRsc];
            _player.resources[choosenRsc] = 0;
            _player.resourceCount = _player.resourceCount - count;
            sum = sum + count;
        }
        player.resources[choosenRsc] = player.resources[choosenRsc] + sum;
        player.resourceCount = player.resourceCount + sum;
    };

    this.changePlayerTradeCoefs = function (player, node) {
        this.log("w/" + this.game.id + " change PlayerTradeCoefs of " + player.username + " with rsrc " + JSON.stringify(player.changePlayerTradeCoefs));// LOG
        if (node.harbor.type == "*")
            for (var rsc in player.resourceTradeCoef)
                player.resourceTradeCoef[rsc] = node.harbor.tradeCoef;
        else
            player.resourceTradeCoef[node.harbor.type] = node.harbor.tradeCoef;
        this.log("w/" + this.game.id + " changed PlayerTradeCoefs of " + player.username + " with rsrc " + JSON.stringify(player.changePlayerTradeCoefs));// LOG  
    };

    this.calculateLongestRoadOfPlayers = function () {
        this.log("w/" + this.game.id + " calculateLongestRoadOfPlayers");// LOG 
        for (var key in this.players) this.calculateLongestRoadOf(this.players[key]);
    };

    this.calculateLongestRoadOf = function (player) {
        this.log("w/" + this.game.id + " calculateLongestRoadOfPlayer " + player.username);// LOG
        var maxLength = 0;

        if (false) { // TODO
            if (this.world.playerroads[player.username] != null) {
                maxLength = this.world.playerroads[player.username].maxLength();
            }
        }
        else {
            var roads = this.getAllRoadOf(player);
            this.log(JSON.stringify(roads, null, 2));
            for (var r = 0; r < roads.length; r++) {
                var road = roads[r];
                if (road.alreadyCounted) continue;
                road.alreadyCounted = true;
                var currentLength = 0;
                currentLength = this.processRoad(roads, road, 1)
                maxLength = Math.max(maxLength, currentLength);
            }
        }

        player.longestRoad = maxLength;
        this.log("w/" + this.game.id + " -> " + player.longestRoad);// LOG 

    };

    this.processRoad = function (roads, road, length) {
        if (this.roadHasNext(roads, road)) {
            var nexts = this.getNextRoads(roads, road);
            for (var n = 0; n < nexts.length; n++)
                nexts[n].alreadyCounted = true; // count all
            if (nexts.length > 0) return this.processRoad(roads, nexts[0], length + 1);
        }
        return length;
    };

    this.getAllRoadOf = function (player) {
        var roads = [];
        for (var r = 0; r < this.world.roads.length; r++)
            if (this.world.roads[r].player.index == player.index) {
                this.world.roads[r].alreadyCounted = false;
                roads.push(this.world.roads[r]);
            }
        return roads;
    };

    this.updatePlayersScore = function() {
        for (var key in this.players) this.players[key].score = 0; // reset score
        var types = ["", "settlement", "city"];
        for (var n=0; n<this.world.nodes.length; n++) {
            var node = this.world.nodes[n];
            if (node.build.type == 0) continue;
            this.log("w/"+ this.game.id + " Build found: " + node.build.player.username);// LOG
            var player = this.players[node.build.player.username];
            var type = types[node.build.type];
            player.score = player.score + this.rules.points[type];
        }
        // victory point
        for (var key in this.players) 
            this.players[key].score = this.players[key].score + this.players[key].devCards.played.victoryPoint;
        // check the strongest knigth
        var strength = Math.max(this.rules.extra.strongestKnight.condition - 1, this.currentStrongestKnight.strength);
        for (var key in this.players) {
            if (this.players[key].devCards.played.knight > strength) {
                strength = this.players[key].devCards.played.knight;
                this.strongestKnight = {
                    player: { username: key, index: this.players[key].index},
                    strength: this.players[key].devCards.played.knight,
                    turn: this.currentTurn.turn
                };
            }
        }
        if (strength > this.rules.extra.strongestKnight.condition - 1)
            this.players[this.strongestKnight.player.username].score = this.players[this.strongestKnight.player.username].score + this.rules.extra.strongestKnight.points;
        // check for longest road
        // TODO:
    }

    this.getWinner = function(){
        this.updatePlayersScore();
        for (var key in this.players) {
            if (this.players[key].score + this.players[key].devCards.tradedInthisTurn.victoryPoint >= this.rules.victoryPoint) {
            return this.players[key];
            }
        }
        return null;
    }

    this.endGame = function(winner) {
        this.currentAction.todo = "VICTORY";
    }

    this.getPlayersInfos = function() {
        var playersInfos = [];
        for (var key in this.players)
            playersInfos.push({
            index: this.players[key].index,
            username: this.players[key].username,
            score: this.players[key].score,
            resourceCount: this.players[key].resourceCount,
            playedKnigth: this.players[key].devCards.played.knight,
            longestRoad: this.players[key].longestRoad
            });
        return playersInfos
    }

    this.getCurrentTrades = function() {
        return this.trades;
        /*var currentTrades = [];
        this.log(JSON.stringify(this.trades));
        if (this.currentTurn.phase != 'TRADING') return currentTrades;
        for (var t=this.trades.length-1; t>=0; t--) {
            var trade = this.trades[t];
            if (trade.turn == this.currentTurn.turn)
            currentTrades.push(trade);
            else break;
        }
        return currentTrades;*/
    }

    this.log = function(text, param) {
        if (true) {
            if (param) console.log(text, param); else console.log(text);
        }
    }

    this.getCost = function (type) {
        return this.utils.getCosts(this.rules.costs, type);
    }
  
};
module.exports = Soc;