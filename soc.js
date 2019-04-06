var Soc = function(game, options) {
  this.game = game;
  this.options = options;
  this.currentTurn = {
    turn: 1,
    player: 0,
    phase: "SPECIAL_TURN",
    dice1: 0,
    dice2: 0,
  };
  this.playerCount = 0;
  this.devCardStub = [];
  this.rules = {
    costs: {
      road: { lumber: 1, bricks: 1 },
      settlement: { lumber: 1, bricks: 1, wool: 1, grain: 1 },
      city: { ore: 2, grain: 3 },
      devCard: { ore: 1, grain: 1, wool: 1 },
      boat: { lumber: 1, wool: 1 },
      knight: { ore: 1, wool: 1 },
      cityWalls: { bricks: 2 }
    },
    pieces: { road: 15, settlement: 5, city: 4, boat: 0, citywalls: 0 },
    harvest: { settlement: 1, city: 2 },
    points: { settlement: 1, city: 2 },
    extra: { longestRoad: { condition: 5, points: 2}, strongestKnight: { condition: 3, points: 2}},
    minPlayerCountToPlay: 3,
    maxPlayerCountToPlay: 4,
    devCardStub: { 
      knight: 14, victoryPoint: 5, 
      roadBuilding: 2, monopoly: 2, yearOfPlenty: 2
    },
    maxDevCardByTurn: 1,
    specialTurnCount: 2,
    specialTurns: [
      {
        turn: 1,
        sens: 1,
        toPlace: ["SETTLEMENT", "ROAD"],
        harvest: false
      },
      {
        turn: 2,
        sens: -1,
        toPlace: ["SETTLEMENT", "ROAD"],
        harvest: true
      }
    ],
    normalTurn: [ "ROLL_DICE", "TRADING", "BUILDING"],
    phaseToCanPlayDevCard: [ "ROLL_DICE", "TRADING", "BUILDING"],
    resourceTradeCoef: { bricks: 4, lumber: 4, wool: 4, grain: 4, ore: 4 },
    resourceLimit: 7,
    victoryPoint: 10
  };  
  
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
  this.world = {
    robber: { x: -4, y: 2},
    tiles: [
      { x:  0, y:  0, type: "PASTURE",   value: 11 },
      
      { x:  0, y:  2, type: "FIELDS",    value:  6 },
      { x:  2, y:  1, type: "PASTURE",   value:  5 },
      { x:  2, y: -1, type: "HILLS",     value:  9 },
      { x:  0, y: -2, type: "FOREST",    value:  4 },
      { x: -2, y: -1, type: "MOUNTAINS", value:  3 },
      { x: -2, y:  1, type: "PASTURE",   value: 10 },
      
      { x:  0, y:  4, type: "HILLS",     value: 11 },
      { x:  2, y:  3, type: "FIELDS",    value:  2 },
      { x:  4, y:  2, type: "MOUNTAINS", value:  9 },
      { x:  4, y:  0, type: "FIELDS",    value: 10 },
      { x:  4, y: -2, type: "FOREST",    value:  8 },
      { x:  2, y: -3, type: "PASTURE",   value:  3 },
      { x:  0, y: -4, type: "FOREST",    value:  6 },
      { x: -2, y: -3, type: "FIELDS",    value: 12 },
      { x: -4, y: -2, type: "MOUNTAINS", value:  5 },
      { x: -4, y:  0, type: "FOREST",    value:  8 },
      { x: -4, y:  2, type: "DESERT",    value:  0 },
      { x: -2, y:  3, type: "HILLS",     value:  4 }, 

      { x:  0, y:  6, type: "SEA",       value:  0, harbor: "*"       },
      { x:  2, y:  5, type: "SEA",       value:  0, harbor: "no"      },
      { x:  4, y:  4, type: "SEA",       value:  0, harbor: "*"       },
      { x:  6, y:  3, type: "SEA",       value:  0, harbor: "no"      },
      { x:  6, y:  1, type: "SEA",       value:  0, harbor: "wool"    },
      { x:  6, y: -1, type: "SEA",       value:  0, harbor: "no"      },
      { x:  6, y: -3, type: "SEA",       value:  0, harbor: "*"       },
      { x:  4, y: -4, type: "SEA",       value:  0, harbor: "no"      },
      { x:  2, y: -5, type: "SEA",       value:  0, harbor: "grain"   },
      { x:  0, y: -6, type: "SEA",       value:  0, harbor: "no"      },
      { x: -2, y: -5, type: "SEA",       value:  0, harbor: "bricks"  },
      { x: -4, y: -4, type: "SEA",       value:  0, harbor: "no"      },
      { x: -6, y: -3, type: "SEA",       value:  0, harbor: "*"       },
      { x: -6, y: -1, type: "SEA",       value:  0, harbor: "no"      },
      { x: -6, y:  1, type: "SEA",       value:  0, harbor: "lumber"  },
      { x: -6, y:  3, type: "SEA",       value:  0, harbor: "no"      },
      { x: -4, y:  4, type: "SEA",       value:  0, harbor: "ore"     },
      { x: -2, y:  5, type: "SEA",       value:  0, harbor: "no"      },
    ],
    nodes: [],
    roads: [
      { id:  1, player: { index: -1, username: "" }, nodes: [  { i: -1, j:  1 }, { i:  1, j:  1 } ] },
      { id:  2, player: { index: -1, username: "" }, nodes: [  { i:  1, j:  1 }, { i:  1, j:  0 } ] },
      { id:  3, player: { index: -1, username: "" }, nodes: [  { i:  1, j:  0 }, { i:  1, j: -1 } ] },
      { id:  4, player: { index: -1, username: "" }, nodes: [  { i:  1, j: -1 }, { i: -1, j: -1 } ] },
      { id:  5, player: { index: -1, username: "" }, nodes: [  { i: -1, j: -1 }, { i: -1, j:  0 } ] },
      { id:  6, player: { index: -1, username: "" }, nodes: [  { i: -1, j:  0 }, { i: -1, j:  1 } ] },

      { id:  7, player: { index: -1, username: "" }, nodes: [  { i: -1, j:  1 }, { i: -1, j:  2 } ] },
      { id:  8, player: { index: -1, username: "" }, nodes: [  { i:  1, j:  1 }, { i:  1, j:  2 } ] },
      { id:  9, player: { index: -1, username: "" }, nodes: [  { i:  1, j:  0 }, { i:  3, j:  0 } ] },
      { id: 10, player: { index: -1, username: "" }, nodes: [  { i:  1, j: -1 }, { i:  1, j: -2 } ] },
      { id: 11, player: { index: -1, username: "" }, nodes: [  { i: -1, j: -1 }, { i: -1, j: -2 } ] },
      { id: 12, player: { index: -1, username: "" }, nodes: [  { i: -1, j:  0 }, { i: -3, j:  0 } ] },

      { id: 13, player: { index: -1, username: "" }, nodes: [  { i: -3, j:  0 }, { i: -3, j:  1 } ] },
      { id: 14, player: { index: -1, username: "" }, nodes: [  { i: -3, j:  1 }, { i: -3, j:  2 } ] },
      { id: 15, player: { index: -1, username: "" }, nodes: [  { i: -3, j:  2 }, { i: -1, j:  2 } ] },
      { id: 16, player: { index: -1, username: "" }, nodes: [  { i: -1, j:  2 }, { i: -1, j:  3 } ] },
      { id: 17, player: { index: -1, username: "" }, nodes: [  { i: -1, j:  3 }, { i:  1, j:  3 } ] },
      { id: 18, player: { index: -1, username: "" }, nodes: [  { i:  1, j:  3 }, { i:  1, j:  2 } ] },
      { id: 19, player: { index: -1, username: "" }, nodes: [  { i:  1, j:  2 }, { i:  3, j:  2 } ] },
      { id: 20, player: { index: -1, username: "" }, nodes: [  { i:  3, j:  2 }, { i:  3, j:  1 } ] },
      { id: 21, player: { index: -1, username: "" }, nodes: [  { i:  3, j:  1 }, { i:  3, j:  0 } ] },
      { id: 22, player: { index: -1, username: "" }, nodes: [  { i:  3, j:  0 }, { i:  3, j: -1 } ] },
      { id: 23, player: { index: -1, username: "" }, nodes: [  { i:  3, j: -1 }, { i:  3, j: -2 } ] },
      { id: 24, player: { index: -1, username: "" }, nodes: [  { i:  3, j: -2 }, { i:  1, j: -2 } ] },
      { id: 25, player: { index: -1, username: "" }, nodes: [  { i:  1, j: -2 }, { i:  1, j: -3 } ] },
      { id: 26, player: { index: -1, username: "" }, nodes: [  { i:  1, j: -3 }, { i: -1, j: -3 } ] },
      { id: 27, player: { index: -1, username: "" }, nodes: [  { i: -1, j: -3 }, { i: -1, j: -2 } ] },
      { id: 28, player: { index: -1, username: "" }, nodes: [  { i: -1, j: -2 }, { i: -3, j: -2 } ] },
      { id: 29, player: { index: -1, username: "" }, nodes: [  { i: -3, j: -2 }, { i: -3, j: -1 } ] },
      { id: 30, player: { index: -1, username: "" }, nodes: [  { i: -3, j: -1 }, { i: -3, j:  0 } ] },

      { id: 31, player: { index: -1, username: "" }, nodes: [  { i: -3, j:  1 }, { i: -5, j:  1 } ] },
      { id: 32, player: { index: -1, username: "" }, nodes: [  { i: -3, j:  2 }, { i: -3, j:  3 } ] },
      { id: 33, player: { index: -1, username: "" }, nodes: [  { i: -1, j:  3 }, { i: -1, j:  4 } ] },
      { id: 34, player: { index: -1, username: "" }, nodes: [  { i:  1, j:  3 }, { i:  1, j:  4 } ] },
      { id: 35, player: { index: -1, username: "" }, nodes: [  { i:  3, j:  2 }, { i:  3, j:  3 } ] },
      { id: 36, player: { index: -1, username: "" }, nodes: [  { i:  3, j:  1 }, { i:  5, j:  1 } ] },
      { id: 37, player: { index: -1, username: "" }, nodes: [  { i:  3, j: -1 }, { i:  5, j: -1 } ] },
      { id: 38, player: { index: -1, username: "" }, nodes: [  { i:  3, j: -2 }, { i:  3, j: -3 } ] },
      { id: 39, player: { index: -1, username: "" }, nodes: [  { i:  1, j: -3 }, { i:  1, j: -4 } ] },
      { id: 40, player: { index: -1, username: "" }, nodes: [  { i: -1, j: -3 }, { i: -1, j: -4 } ] },
      { id: 41, player: { index: -1, username: "" }, nodes: [  { i: -3, j: -2 }, { i: -3, j: -3 } ] },
      { id: 42, player: { index: -1, username: "" }, nodes: [  { i: -3, j: -1 }, { i: -5, j: -1 } ] },

      { id: 43, player: { index: -1, username: "" }, nodes: [  { i: -5, j:  1 }, { i: -5, j:  2 } ] },
      { id: 44, player: { index: -1, username: "" }, nodes: [  { i: -5, j:  2 }, { i: -5, j:  3 } ] },
      { id: 45, player: { index: -1, username: "" }, nodes: [  { i: -5, j:  3 }, { i: -3, j:  3 } ] },
      { id: 46, player: { index: -1, username: "" }, nodes: [  { i: -3, j:  3 }, { i: -3, j:  4 } ] },
      { id: 47, player: { index: -1, username: "" }, nodes: [  { i: -3, j:  4 }, { i: -1, j:  4 } ] },
      { id: 48, player: { index: -1, username: "" }, nodes: [  { i: -1, j:  4 }, { i: -1, j:  5 } ] },
      { id: 49, player: { index: -1, username: "" }, nodes: [  { i: -1, j:  5 }, { i:  1, j:  5 } ] },
      { id: 50, player: { index: -1, username: "" }, nodes: [  { i:  1, j:  5 }, { i:  1, j:  4 } ] },
      { id: 51, player: { index: -1, username: "" }, nodes: [  { i:  1, j:  4 }, { i:  3, j:  4 } ] },
      { id: 52, player: { index: -1, username: "" }, nodes: [  { i:  3, j:  4 }, { i:  3, j:  3 } ] },
      { id: 53, player: { index: -1, username: "" }, nodes: [  { i:  3, j:  3 }, { i:  5, j:  3 } ] },
      { id: 54, player: { index: -1, username: "" }, nodes: [  { i:  5, j:  3 }, { i:  5, j:  2 } ] },
      { id: 55, player: { index: -1, username: "" }, nodes: [  { i:  5, j:  2 }, { i:  5, j:  1 } ] },
      { id: 56, player: { index: -1, username: "" }, nodes: [  { i:  5, j:  1 }, { i:  5, j:  0 } ] },
      { id: 57, player: { index: -1, username: "" }, nodes: [  { i:  5, j:  0 }, { i:  5, j: -1 } ] },
      { id: 58, player: { index: -1, username: "" }, nodes: [  { i:  5, j: -1 }, { i:  5, j: -2 } ] },
      { id: 59, player: { index: -1, username: "" }, nodes: [  { i:  5, j: -2 }, { i:  5, j: -3 } ] },
      { id: 60, player: { index: -1, username: "" }, nodes: [  { i:  5, j: -3 }, { i:  3, j: -3 } ] },
      { id: 61, player: { index: -1, username: "" }, nodes: [  { i:  3, j: -3 }, { i:  3, j: -4 } ] },
      { id: 62, player: { index: -1, username: "" }, nodes: [  { i:  3, j: -4 }, { i:  1, j: -4 } ] },
      { id: 63, player: { index: -1, username: "" }, nodes: [  { i:  1, j: -4 }, { i:  1, j: -5 } ] },
      { id: 64, player: { index: -1, username: "" }, nodes: [  { i:  1, j: -5 }, { i: -1, j: -5 } ] },
      { id: 65, player: { index: -1, username: "" }, nodes: [  { i: -1, j: -5 }, { i: -1, j: -4 } ] },
      { id: 66, player: { index: -1, username: "" }, nodes: [  { i: -1, j: -4 }, { i: -3, j: -4 } ] },
      { id: 67, player: { index: -1, username: "" }, nodes: [  { i: -3, j: -4 }, { i: -3, j: -3 } ] },
      { id: 68, player: { index: -1, username: "" }, nodes: [  { i: -3, j: -3 }, { i: -5, j: -3 } ] },
      { id: 69, player: { index: -1, username: "" }, nodes: [  { i: -5, j: -3 }, { i: -5, j: -2 } ] },
      { id: 70, player: { index: -1, username: "" }, nodes: [  { i: -5, j: -2 }, { i: -5, j: -1 } ] },
      { id: 71, player: { index: -1, username: "" }, nodes: [  { i: -5, j: -1 }, { i: -5, j:  0 } ] },
      { id: 72, player: { index: -1, username: "" }, nodes: [  { i: -5, j:  0 }, { i: -5, j:  1 } ] }
    ]
  };
  this.players = [];
  this.init = function(beginningPlayers) {
    // init Players
    this.playerCount = beginningPlayers.length;
    for(var p = 0; p < beginningPlayers.length; p++){
      this.players[beginningPlayers[p].username] = {
        index: p, 
        username: beginningPlayers[p].username,
        pieces: { road: 15, settlement: 5, city: 4, boat: 0, citywalls: 0 },
        score: 0,
        resources: { bricks: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
        resourceCount: 0,
        resourcesToReturn: { bricks: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
        resourceToReturnCount: 0,
        resourceLimit: this.rules.resourceLimit,
        trades: [], yearOfPlentyChoosenCards: [], monopoly: "",
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
        }
      };
      // Calcul nodes from tiles
      console.log("Set playerData for " +  beginningPlayers[p].username + "=>" + this.players[beginningPlayers[p].username].pieces.road + " roads...");// LOG
      console.log("Building nodes... (" + this.world.tiles.length + ")");// LOG
      
      this.shuffleTiles();

      for (var t=0; t<this.world.tiles.length; t++) {
        var tile = this.world.tiles[t];
        if (tile.type == "SEA") continue;
        for (var dx=-1; dx<2; dx=dx+2) 
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
                //console.log("neighbouringTile exists: " + neighbouringTile.x + ", " + neighbouringTile.y);// LOG
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
      console.log("Nodes built " + this.world.nodes.length);// LOG
      // place harbors
      this.placeHarbor( -1,  5, { type: "*", tradeCoef: 3} );
      this.placeHarbor(  1,  5, { type: "*", tradeCoef: 3} );
      this.placeHarbor(  3,  3, { type: "*", tradeCoef: 3} );
      this.placeHarbor(  3,  4, { type: "*", tradeCoef: 3} );
      this.placeHarbor(  5,  2, { type: "wool", tradeCoef: 2} );
      this.placeHarbor(  5,  1, { type: "wool", tradeCoef: 2} );
      this.placeHarbor(  5, -2, { type: "*", tradeCoef: 3} );
      this.placeHarbor(  5, -3, { type: "*", tradeCoef: 3} );
      this.placeHarbor(  1, -4, { type: "grain", tradeCoef: 2} );
      this.placeHarbor(  1, -5, { type: "grain", tradeCoef: 2} );
      this.placeHarbor( -1, -4, { type: "bricks", tradeCoef: 2} );
      this.placeHarbor( -3, -4, { type: "bricks", tradeCoef: 2} );
      this.placeHarbor( -5, -3, { type: "*", tradeCoef: 3} );
      this.placeHarbor( -5, -2, { type: "*", tradeCoef: 3} );
      this.placeHarbor( -5,  0, { type: "lumber", tradeCoef: 2} );
      this.placeHarbor( -5,  1, { type: "lumber", tradeCoef: 2} );
      this.placeHarbor( -5,  3, { type: "ore", tradeCoef: 2} );
      this.placeHarbor( -3,  3, { type: "ore", tradeCoef: 2} );
      // Calcul roads from nodes
      // TODO:
      // Init DevCard Stub
      for (var key in this.rules.devCardStub) {
        var count = this.rules.devCardStub[key];
        for (var i=0; i<count; i++)
          this.devCardStub.push(key);
      }
      console.log("w/"+ this.game.id + " DevCard Stub: " + this.devCardStub);// LOG
      this.shuffleArray(this.devCardStub);
      console.log("w/"+ this.game.id + " DevCard Stub: " + this.devCardStub);// LOG
    }
  };
  this.placeHarbor = function(i, j, harbor) {
    var node = this.world.nodes.find( function( ele ) { 
      return ele.i === i && ele.j === j;
    });
    if (node) // the node exists
      node.harbor = harbor;
  }
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
    console.log("w/"+ this.game.id + " Can the road be placed?");// LOG
    // SPECIAL TURN
    if (this.isSpecialTurn()) {
      console.log("w/"+ this.game.id + " Can the road be placed in this special turn?");// LOG
      var isolatedBuild = this.world.nodes.find( function( ele ) { 
        return ele.build.player.index == player.index && !ele.build.connected;
      });
      if (isolatedBuild) {
        console.log("w/"+ this.game.id + " We found the build to connect this road.");// LOG
        if ((road.nodes[0].i == isolatedBuild.i && road.nodes[0].j == isolatedBuild.j)
         || (road.nodes[1].i == isolatedBuild.i && road.nodes[1].j == isolatedBuild.j)){
          isolatedBuild.build.connected = true;
          return true;
        }

      }
    }
    // NORMAL TURN
    else { // NEVER CALL
      console.log("w/"+ this.game.id + " Can the road be placed in this normal turn?");// LOG
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
    console.log("w/"+ this.game.id + " Can place settlement or city in special turn?" );// LOG
    //console.log("build.type ", node.build.type);// LOG
    //console.log("build.player ", node.build.player);// LOG
    //console.log("knight.force ", node.knight.force);// LOG
    // check if not other build or other owner or knight
    if (node.build.type != 0 || node.build.player.index != -1 || node.knight.force != 0)
      return false;
    // check neighbours
    return this.allNeighboursAreFree(node);
  };

  /** Can place road in normal turn ?
   * player: Player
   * userData: Road
   * return: Boolean
   * */
  this.canPlaceRoadInNormalTurn = function(player, userData) {
    console.log("w/"+ this.game.id + " Can " + player.username + " place road in normal turn?");// LOG
    for(var r=0; r<this.world.roads.length; r++) {
      var otherRoad = this.world.roads[r];
      console.log("w/"+ this.game.id + " Other road ID " + otherRoad.id);// LOG
      console.log("w/"+ this.game.id + " OtherRoad.player.index " + otherRoad.player.index);// LOG
      console.log("w/"+ this.game.id + " OtherRoad.player " + otherRoad.player);// LOG
      if (this.isAdjacentRoad(otherRoad, userData) && otherRoad.player.index == player.index) {
        console.log("w/"+ this.game.id + "YES" );// LOG
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
    console.log("w/"+ this.game.id + " Can " + player.username + " place settlement in normal turn?");// LOG
    //console.log("build.type ", node.build.type);// LOG
    //console.log("build.player ", node.build.player);// LOG
    //console.log("knight.force ", node.knight.force);// LOG
    // check if not other build or other owner or knight
    if (node.build.type != 0 || node.build.player.index != -1 || node.knight.force != 0)
      return false;
    // check neighbours
    return this.allNeighboursAreFree(node) && this.isOnRoad(player, node);
  };
  /** Can place settlement in normal turn?
   * player: Player (not used)
   * node: Node
   * return: Boolean
   * */
  this.canPlaceCityInNormalTurn = function(player, node) {
    console.log("w/"+ this.game.id + " Can " + player.username + " place city in normal turn?");// LOG
    return node.build.player.index == player.index && node.build.type == 1; 
  };

  /** Can buy?
   * obj: string "road", "settlement", "city", "devCard", "boat", "knight", "cityWalls"
   * username: string
   * return: Boolean
   * */
  this.canBuy = function(obj, username) {
    for(var key in this.rules.costs[obj]) {
      if (this.players[username].resources[key] < this.rules.costs[obj][key])
        return false;
    }
    return true;
  };
  /** Can move rober on */
  this.canMoveRobberOn = function(data) {
    if (data.x == this.world.robber.x && data.y == this.world.robber.y) return false;
    if (data.type == "SEA") return false;
    return true;
  }
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
    console.log("Can '" + username + "' play? (" + userAction.todo + ")");// LOG
    var player = this.players[username];
    if (this.currentAction.todo == "THIEF" && userAction.todo == "SEND_RSRC_TO_BANK" && userAction.turn == this.currentAction.turn) {
      return true;
    }
    if (username != this.currentAction.to.username || userAction.turn != this.currentAction.turn) {
      console.log("And no, " + username + ", you can't.");// LOG
      return false;
    }
    // SPECIAL TURN
    if (this.isSpecialTurn()) {
      console.log("w/"+ this.game.id + " SPECIAL TURN");// LOG
      if (userAction.todo != this.currentAction.todo) {
        console.log("And no, " + username + ", you can't.");// LOG
        return false;
      }
      switch(userAction.todo) {
        case "SETTLEMENT":
        case "CITY":
          if (userData.type != "node") return false; 
          var choosenNode = this.world.nodes.find( function( ele ) { 
            return ele.i === userData.data.i && ele.j === userData.data.j;
          });
          if (choosenNode) {// we found the node selected by the player
            console.log("w/"+ this.game.id + " We found the node selected by the player " + choosenNode);// LOG
            if (this.canPlaceSettlementOrCityInSpecialTurn(player, choosenNode)) {
              console.log("w/"+ this.game.id + "And we can place it!");// LOG
              // update model -> world -> nodes
              choosenNode.build.type = 1;
              choosenNode.build.player.index = player.index;
              choosenNode.build.player.username = username;
              if (choosenNode.harbor.type != "no") this.changePlayerTradeCoefs(player, choosenNode);
              var specialTurnRule = this.rules.specialTurns[userAction.turn - 1]
              if (specialTurnRule.harvest) {
                for (var t=0; t<choosenNode.tiles.length; t++) {                  
                  var tile = this.world.tiles.find( function( ele ) { 
                    return ele.x === choosenNode.tiles[t].x && ele.y === choosenNode.tiles[t].y; 
                  });
                  if(tile){ // a matched tile pour this player
                    var value = 0 ;
                    if (userAction.todo == "SETTLEMENT") value = this.rules.harvest.settlement; else if (userAction.todo == "CITY") value = this.rules.harvest.city;
                    console.log("w/"+ this.game.id + " Tile for haverst found: " + tile.type + " -> " + value);// LOG
                    this.harvest(player, tile, value);
                  }
                }
              }
              return true;
            }
            console.log("w/"+ this.game.id + " Ho! We can't!");// LOG
          }
          return false;
        case "ROAD":
          if (userData.type != "road") return false; 
          var choosenRoad = this.world.roads.find( function( ele ) { 
            return ele.nodes[0].i === userData.data.nodes[0].i && ele.nodes[0].j === userData.data.nodes[0].j
                && ele.nodes[1].i === userData.data.nodes[1].i && ele.nodes[1].j === userData.data.nodes[1].j;
          });
          if (choosenRoad) {// we found the road selected by the player
            console.log("w/"+ this.game.id + " We found the road selected by the player.");// LOG
            if (this.canPlaceRoad(player, choosenRoad)) {
              // update model -> world -> roads
              choosenRoad.player.index = player.index;
              choosenRoad.player.username = username;
              return true;
            }
          }
          return false;
      }
    }
    // NORMAL TURN
    else {
      console.log("w/"+ this.game.id + " NORMAL TURN");// LOG
      console.log("w/"+ this.game.id + " this.currentTurn.phase: " + this.currentTurn.phase);// LOG
      console.log("w/"+ this.game.id + " this.currentAction.todo: " + this.currentAction.todo);// LOG
      console.log("w/"+ this.game.id + " userAction.todo: " + userAction.todo);// LOG
      switch (userAction.todo) {
        case "PLAY_KNIGHT": 
           return (this.currentTurn.phase == "ROLL_DICE" || this.currentTurn.phase == "TRADING" || this.currentTurn.phase == "BUILDING" )
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
  }
  
  /** Play
   * username: string
   * userAction: obj
   * userData: obj
   * */
  this.play = function(username, userAction, userData) {
    console.log("w/"+ this.game.id + " '" + username + "' is playing " + userAction.todo);// LOG
    var player = this.players[username];
    // SPECIAL TURN
    if (this.isSpecialTurn()) {
      if (userAction.todo == "ROAD") { this.players[username].pieces.road--; }// The road has been placed in the function canPlay()
      else if (userAction.todo == "SETTLEMENT") { this.players[username].pieces.settlement--; }// The settlement has been placed in the function canPlay()
      else if (userAction.todo == "CITY") { this.players[username].pieces.city--; }// The city has been placed in the function canPlay()
      console.log("w/"+ this.game.id + " '" + username + "' place " + userAction.todo + " at " + userData.data.i + "," + userData.data.j);// LOG
      var turn = this.currentTurn.turn;
      var specialTurnRule = this.rules.specialTurns[turn - 1];
      var currentActionFound = false;
      var t = 0;
      for (t; t<specialTurnRule.toPlace.length; t++) {
        if (this.currentAction.todo == specialTurnRule.toPlace[t]) {
          // current action found
          console.log("w/"+ this.game.id + " Current action found: " + this.currentAction.todo);// LOG
          currentActionFound = true;
          break;
        }
      }
      if (currentActionFound) {
        // End of special turn for this user ?
        if (t == specialTurnRule.toPlace.length - 1) {
          // YES
          console.log("w/"+ this.game.id + " End of special turn? => YES" );// LOG
          // Is a next player exist for this turn?
          var nextPlayerIndex = this.currentTurn.player + specialTurnRule.sens;
          if (nextPlayerIndex == -1 || nextPlayerIndex == this.playerCount) {
            console.log("w/"+ this.game.id + " No next player for this run => nextTurn" );// LOG
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
            console.log("w/"+ this.game.id + " There is a next player for this run => nextPlayer" );// LOG
            this.currentTurn.player = this.currentTurn.player + specialTurnRule.sens;
            this.currentAction.todo = specialTurnRule.toPlace[0];
            for (var key in this.players) {
              console.log("w/"+ this.game.id + " key => " + key + "(TODO: do a function)");// LOG
              if (this.players[key].index == this.currentTurn.player){
                this.currentAction.to = this.players[key];
                break;
              }
            }
          }

        }
        else {
          // NO => no change player, just set next action 
          console.log("w/"+ this.game.id + " End of special turn? => NO" );// LOG
          this.currentAction.todo = specialTurnRule.toPlace[t + 1];
          console.log("w/"+ this.game.id + " Next todo for " + username + " => " + this.currentAction.todo);// LOG
        }

      }
    }
    // NORMAL TURN
    else {
      console.log("w/"+ this.game.id + " this.currentAction.todo = " + this.currentAction.todo);// LOG
      if (this.currentAction.todo == 'THIEF' && userAction.todo == 'SEND_RSRC_TO_BANK') {
        player.resourcesToReturn = userAction.resourcesToReturn;
        console.log("w/"+ this.game.id + " " + username + " with rsrc " + JSON.stringify(player.resources));// LOG
        console.log("w/"+ this.game.id + " " + username + " send rsrc " + JSON.stringify(player.resourcesToReturn));// LOG
        for (var rsc in player.resourcesToReturn) {
          var count = player.resourcesToReturn[rsc];
          player.resources[rsc] = player.resources[rsc] - count;
          player.resourcesToReturn[rsc] = 0;
          player.resourceCount = player.resourceCount - count;
          player.resourceToReturnCount = player.resourceToReturnCount - count;
          if (player.resourceToReturnCount == 0) break; // in case where the plaayer sended too rsrc
        }
        player.resourceToReturnCount = 0;
        console.log("w/"+ this.game.id + " " + username + " has rsrc  " + JSON.stringify(player.resources));// LOG
        // check if other player have to send resources
        var canContinue = true;
        for (var usr in this.players) {
          if (this.players[usr].resourceToReturnCount > 0) {
            canContinue = false;
            break;
          }
        }
        if (canContinue) {
          this.currentAction.todo = 'MOVE_ROBBER';
        }
      }
      else if (this.currentAction.todo == 'CHOOSE_YEAR_OF_PLENTY' && userAction.todo == 'SEND_CHOOSEN_CARDS_OF_YEAR_OF_PLENTY') {
        this.addChoosenResources(player, userAction.yearOfPlentyChoosenCards);
        this.currentAction.todo = 'PLAY';
      }
      else if (this.currentAction.todo == 'CHOOSE_MONOPOLY' && userAction.todo == 'SEND_CHOOSEN_RESOURCE_OF_MONOPOLY') {
        this.playMonopoly(player, userAction.monopolyChoosenResource);
        this.currentAction.todo = 'PLAY';
        console.log("w/"+ this.game.id + " " + username + " MONOPOLY:  +" + userAction.monopolyChoosenResource);// LOG
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
              console.log("w/"+ this.game.id + " THIEF." );// LOG
              // Calculate resourceToReturnCount for each player
              for (var key in this.players) {
                var _player = this.players[key];
                console.log("w/"+ this.game.id + " " + _player.username + " (" + _player.resourceCount + ">" + _player.resourceLimit + ")");// LOG
                _player.resourceToReturnCount = 0;
                if (_player.resourceCount > _player.resourceLimit) {
                  _player.resourceToReturnCount = Math.floor(_player.resourceCount / 2);
                  this.currentAction.todo = 'THIEF';
                }
                console.log("w/"+ this.game.id + " " + _player.username + " resourceToReturnCount:" + _player.resourceToReturnCount);
              }
            }
            else {
              // HARVEST
              this.harvestAll(dice);
            }
            break;
          case "MOVE_ROBBER":
            if (userAction.todo == 'MOVE_ROBBER') {
              console.log("w/"+ this.game.id + " New position for robber: " + JSON.stringify(userData));// LOG
              this.world.robber.x = userData.data.x;
              this.world.robber.y = userData.data.y;
              this.currentAction.todo = 'PLAY';
              if (this.currentTurn.phase == "ROLL_DICE") this.currentAction.todo = 'ROLL_DICE';
              // Pickup or not pickup
              var otherPlayers = this.getOthersPlayersOnTile(this.players[username].index, userData.data);
              console.log("w/"+ this.game.id + " Players available to pickup " + JSON.stringify(otherPlayers));// LOG
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
              for (var t=0; t<userAction.trades.length; t++) {
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
              // TODO: save trades in historic?
              player.trades = [];
            break;
          case "END_TRADING":
              this.currentTurn.phase = this.rules.normalTurn[2];
              console.log("w/"+ this.game.id + " this.currentTurn.phase = " + this.currentTurn.phase);// LOG
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
            if (devCard){
              this.buy("devCard", username);
              this.players[username].devCards.tradedInthisTurn[devCard]++;
              if (devCard=="victoryPoint") {
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
  }

  this.harvestAll = function(dice){
    console.log("w/"+ this.game.id + " HARVEST for dice result: " + dice);// LOG
    for (var key in this.players) {
      var _player = this.players[key];
      console.log("w/"+ this.game.id + " HARVEST of: " + _player.username + ' (' + _player.index + ')');// LOG
      for (var n=0; n<this.world.nodes.length; n++) { // loop over all nodes
        var node = this.world.nodes[n];
        if (node.build.type == 0 || node.build.player.index != _player.index) continue; // if no build ot not mine continue
        console.log("w/"+ this.game.id + " HARVEST for node: " + JSON.stringify(node));// LOG
        for (var t=0; t<node.tiles.length; t++) {
          var tile = this.world.tiles.find( function( ele ) { 
            return ele.x === node.tiles[t].x && ele.y === node.tiles[t].y /*&& ele.value === dice*/; // TODO: check if tile is not stolen
          });
          if(tile){ // a matched tile pour this player and this value
            if (tile.value == dice) {
              console.log("w/"+ this.game.id + " Tile for haverst found: " + tile.type + "-" + tile.value);// LOG
              this.harvest(_player, tile, node.build.type);
            }
          }
        }
      }
    }
  }
  /** Harvest 
   * player: Player
   * tile: Tile
   * value: int
   * */  
  this.harvest = function(player, tile, value) {
    // No haverst if tile has the robber
    if (tile.x == this.world.robber.x && tile.y == this.world.robber.y) return;
    switch (tile.type) {
      case "FOREST": // lumber
        player.resources.lumber = player.resources.lumber + value;
      break;
      case "HILLS": // bricks
        player.resources.bricks = player.resources.bricks + value;
      break;
      case "PASTURE": // wool
        player.resources.wool = player.resources.wool + value;
      break;
      case "FIELDS": // grain
        player.resources.grain = player.resources.grain + value;
      break;
      case "MOUNTAINS": // ore
        player.resources.ore = player.resources.ore + value;
      break;
      default:
    }
    player.resourceCount = player.resources.lumber + player.resources.bricks + player.resources.wool 
                         + player.resources.grain + player.resources.ore;
  };

  this.getOthersPlayersOnTile = function(playerIndex, data) {
    console.log("w/"+ this.game.id + " get OthersPlayersOnTile for playerIndex " + playerIndex);// LOG
    console.log("w/"+ this.game.id + " on the tile " + JSON.stringify(data));// LOG
    var _otherPlayers = [];
    for (var n=0; n<this.world.nodes.length; n++) {
      var node = this.world.nodes[n];
      if (node.build.type == 0 || node.build.player.index == playerIndex) continue; // no build or player's build
      // build on tile
      for (var t=0; t<node.tiles.length; t++) {
        if (node.tiles[t].x == data.x && node.tiles[t].y == data.y) {
          _otherPlayers[node.build.player.index ] = true;
          break;
        }
      }
    }
    var otherPlayers = [];
    for (var key in _otherPlayers)
      if (_otherPlayers[key] == true)
      otherPlayers.push(Math.floor(key));
    return otherPlayers;
  }
  /** Pickup resource card
   * to: Player
   * from: int
   */
  this.pickup = function(to, from) {
    console.log("w/"+ this.game.id + " Pickup to " + to.index + " from " + from);// LOG
    if (to.index == from) return; // to=from! 
    var otherPlayer;
    for (var key in this.players) {
      otherPlayer = this.players[key];
      if (otherPlayer.index == from) break;// we found the other player
    }
    console.log("w/"+ this.game.id + " cards of  " + otherPlayer.username + " : " + JSON.stringify(otherPlayer.resources));// LOG
    if (otherPlayer.resourceCount == 0) return; // no cards to pickup!
    var rscs = [];
    for (var r in otherPlayer.resources) {
      if (otherPlayer.resources[r] > 0) rscs.push(r); // get no empty resource
    }
    console.log("w/"+ this.game.id + " cards of  " + otherPlayer.username + " : " + JSON.stringify(rscs));// LOG
    if (rscs.length > 0) {
      this.shuffleArray(rscs);
      var rsc = rscs[0];
      console.log("w/"+ this.game.id + " " + to.username + " pickup " + rsc);// LOG
      // remove resource from
      otherPlayer.resources[rsc]--;
      otherPlayer.resourceCount--;
      // add resource to
      to.resources[rsc]++;
      to.resourceCount++;
    }
  }
  /** Special turn ?
   * return: Boolean
   */
  this.isSpecialTurn = function() {
    return this.currentTurn.turn <= this.rules.specialTurnCount;
  }
  /**  */
  this.acquireDevCard = function(player) {
    for (var rsc in player.devCards.tradedInthisTurn) {
      player.devCards.toPlay[rsc] = player.devCards.toPlay[rsc] + player.devCards.tradedInthisTurn[rsc];
      player.devCards.tradedInthisTurn[rsc] = 0;
    }
  }
  /** Next player in a normal turn */
  this.nextPlayer = function() {
    console.log("w/"+ this.game.id + " Next player." );// LOG
    this.currentTurn.player++;
    if (this.currentTurn.player == this.playerCount) {
      this.currentTurn.player = 0;
      this.currentTurn.turn++;
    }
    for (var key in this.players) {
      console.log("w/"+ this.game.id + " key => " + key + "(TODO: do a function)");// LOG
      if (this.players[key].index == this.currentTurn.player){
        this.currentAction.to = this.players[key];
        this.players[key].devCards.playedThisTurnCount = 0;
        break;
      }
    }
    this.currentAction.turn = this.currentTurn.turn;
    this.currentAction.player = this.currentTurn.player;

    console.log("w/"+ this.game.id + " " + this.currentAction.to.username + " is new player." );// LOG
  }
  /** */
  this.hasRobber = function(tile) {
    for (var t=0; t<this.world.tiles.length; t++) {
      if (this.world.tiles[t].x == tile.x && this.world.tiles[t].y == tile.y)
        return tile.x == this.world.robber.x && tile.y == this.world.robber.y;
    }
  }
  /** All neighbours are free? */
  this.allNeighboursAreFree = function (node) {
    var neighbours = this.getNodeNeighbours(node);
    for (var n=0; n<neighbours.length; n++) {
      if (neighbours[n].build.type != 0) 
        return false;
    }
    return true;
  }
  /** Get all neighboring nodes */
  this.getNodeNeighbours = function(_node) {
    console.log("===> Check neighbours of " + _node.i + "," + _node.j);// LOG
    var neighbours = [];
    for (var n=0; n<this.world.nodes.length; n++) {
      var node = this.world.nodes[n];
      if (this.hasTwoTilesInCommon(_node, node)) {
        console.log("---> Found " + node.i + "," + node.j);// LOG
        neighbours.push(node);
        if (neighbours.length == 3) break;
      }
    }
    return neighbours;
  };
  /** Has 2 tiles in common? */
  this.hasTwoTilesInCommon = function (node1, node2) {
    var inCommom = 0;
    for (var n1=0; n1<node1.tiles.length; n1++) {
      for (var n2=0; n2<node2.tiles.length; n2++) {
        if (node1.tiles[n1].x == node2.tiles[n2].x && node1.tiles[n1].y == node2.tiles[n2].y) {
          inCommom++;
          break;
        }
      }
    }
    return inCommom == 2;
  }
  /** Is adjacent road? */
  this.isAdjacentRoad = function(otherRoad, road) {
    if (otherRoad.id == road.id) return false;
    for (var n1=0; n1<2; n1++) {
      for (var n2=0; n2<2; n2++) {
        var node1 = otherRoad.nodes[n1], node2 = road.nodes[n2];
        if (node1.i == node2.i && node1.j == node2.j) return true;
      }
    }
  }
  this.adjacentRoads = function(roads, road) {
    var adjacentRoads = [];
    for (var r=0; r<roads.length; r++) {
      var otherRoad = roads[r];
      if (this.isAdjacentRoad(otherRoad, road)) adjacentRoads.push(otherRoad);
    }
    return adjacentRoads;
  }
  this.roadHasNext = function (roads, road) {
    for (var r=0; r<roads.length; r++) {
      var otherRoad = roads[r];
      if (this.isAdjacentRoad(otherRoad, road) && !otherRoad.alreadyCounted) return true;
    }
    return false;
  }
  this.getNextRoads = function (roads, road) {
    var nexts = [];
    for (var r=0; r<roads.length; r++) {
      var otherRoad = roads[r];
      if (this.isAdjacentRoad(otherRoad, road) && !otherRoad.alreadyCounted) nexts.push(otherRoad);
    }
    return nexts;
  }
  /**  */
  this.isOnRoad = function (player, node) {
    console.log("w/"+ this.game.id + " ===> isOnRoad of " + JSON.stringify(node));// LOG
    for (var r=0; r<this.world.roads.length; r++) {
      var road = this.world.roads[r];
      if (road.player.index == player.index)
        if ((road.nodes[0].i == node.i && road.nodes[0].j == node.j) || (road.nodes[1].i == node.i && road.nodes[1].j == node.j)) {
          console.log("w/"+ this.game.id + " YES");
          return true;
        }
    }
  }

  /** Buy
   * obj: string "road", "settlement", "city", "devCard", "boat", "knight", "cityWalls"
   * username: string
   * */
  this.buy = function(obj, username) {
    console.log("w/"+ this.game.id + " " + username + " buy " + obj + " in normal turn.");// LOG
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
    console.log("w/"+ this.game.id + " " + username + " place " + obj + " in normal turn. " + JSON.stringify(userData));// LOG
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
    for (var r=0; r<Math.min(2, resources.length); r++) {
      console.log("w/"+ this.game.id + " " + player.username + " YEAR_OF_PLENTY: " + resources[r]);// LOG
      player.resources[resources[r]]++;
      player.resourceCount++;
    }
    player.yearOfPlentyChoosenCards = [];
  }
  this.playMonopoly = function (player, choosenRsc) {
    console.log("w/"+ this.game.id + " " + player.username + " MONOPOLY: " + choosenRsc);// LOG
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
  }
  this.changePlayerTradeCoefs = function (player, node) {
    console.log("w/"+ this.game.id + " change PlayerTradeCoefs of " + player.username + " with rsrc " + JSON.stringify(player.changePlayerTradeCoefs));// LOG
    if (node.harbor.type == "*") 
      for (var rsc in player.resourceTradeCoef)
        player.resourceTradeCoef[rsc] = node.harbor.tradeCoef;
    else
      player.resourceTradeCoef[node.harbor.type] = node.harbor.tradeCoef;
    console.log("w/"+ this.game.id + " changed PlayerTradeCoefs of " + player.username + " with rsrc " + JSON.stringify(player.changePlayerTradeCoefs));// LOG  
  }
  this.calculateLongestRoadOfPlayers = function() {
    console.log("w/"+ this.game.id + " calculateLongestRoadOfPlayers");// LOG 
    for (var key in this.players) this.calculateLongestRoadOf(this.players[key]); 
  }
  this.calculateLongestRoadOf = function (player) {
    console.log("w/"+ this.game.id + " calculateLongestRoadOfPlayer " + player.username);// LOG 
    var roads = this.getAllRoadOf(player);
    var maxLength = 0;
    for (var r=0; r<roads.length; r++) {
      var road = roads[r];
      if (road.alreadyCounted) continue;
      road.alreadyCounted = true;
      var currentLength = 0;
      currentLength = this.processRoad(roads, road, 1)
      maxLength = Math.max(maxLength, currentLength);
    } 
    
    player.longestRoad = maxLength;
    console.log("w/"+ this.game.id + " -> " + player.longestRoad );// LOG 
  }
  this.processRoad = function (roads, road, length) {
    if (this.roadHasNext(roads, road)) {
      var nexts = this.getNextRoads(roads, road);
      for (var n=0; n<nexts.length; n++) {
        nexts[n].alreadyCounted = true; // count all
      }
      if (nexts.length > 0) return this.processRoad(roads, nexts[0], length + 1);
    }
    return length;
  }
  this.getAllRoadOf = function (player) {
    var roads = [];
    for (var r=0; r<this.world.roads.length; r++)
      if (this.world.roads[r].player.index == player.index) {
        this.world.roads[r].alreadyCounted = false;
        roads.push(this.world.roads[r]);
      }
    return roads;
  }
  this.updatePlayersScore = function() {
    for (var key in this.players) this.players[key].score = 0; // reset score
    var types = ["", "settlement", "city"];
    for (var n=0; n<this.world.nodes.length; n++) {
      var node = this.world.nodes[n];
      if (node.build.type == 0) continue;
      console.log("w/"+ this.game.id + " Build found: " + node.build.player.username);// LOG
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

};
module.exports = Soc;