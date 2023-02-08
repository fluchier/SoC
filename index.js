// Setup basic express server
const DEV_PORT = 3001;
let express = require('express');
let app = express();
let server = require('http').createServer(app);
let io = require('socket.io')(server);
const port = process.env.PORT || DEV_PORT;
let Soc = require('./soc');

server.listen(port, function () {
    log('Server listening at port %d', port);// LOG
});

// Routing
app.use(express.static(__dirname));

// Entire GameCollection Object holds all games and info

let gameCollection = new function() {
    this.totalGameCount = 0,
    this.gameList = [],
    this.gameData = {}
};

// Latest 100 messages
let history = [{
    time: Date.now(),
    username: "",
    message: "Server started."
}];

// Chatroom

let numUsers = 0;
let clients = {};

io.on('connection', function (socket) {
    let addedUser = false;

// once a client has connected, we expect to get a ping from them saying what room they want to join
socket.on('room', function(room) {
    log(socket.username + " join room /" + room);// LOG
    socket.join("/"+room);
    //socket.broadcast.to("/"+room).emit('gameMessage', "You are in the game room. Let's play !");
    let game = getGameOfPlayer(socket.username);
    if (game){
        game.inRoom++;
        // All players in game room ?
        if (game.inRoom==game.playerCount) {
        io.to("/"+room).emit('gameMessage', { username: "GAME", message:  "You are in the game room. Let's play !" });
        // init Game
        gameCollection.gameData[room] = new Soc(game, {}); 
        let gameData = gameCollection.gameData[room];
        gameData.init(game.players);
        // send rules et games
        gameData.startTime = Date.now();
        io.to("/"+room).emit('rulesAndGame', { 
            rules: gameData.rules, 
            world: gameData.world, 
            currentTurn: gameData.currentTurn,
            startTime: gameData.startTime,
            playersInfos: gameData.getPlayersInfos()
        });
        // send action to do
        io.to("/"+room).emit('gameData',  { 
            world: gameData.world, 
            currentTurn: gameData.currentTurn,
            currentAction: gameData.currentAction,
            playersInfos: gameData.getPlayersInfos()
        });
        }
        log("in room " +  game.inRoom + "/" + game.playerCount);// LOG
    }
});

// once a client has reconnected, we expect to get a ping from them saying what room they want to join
socket.on('join room', function(room) {
    log(socket.username + " join room /" + room);// LOG
    socket.join("/"+room);
    let game = getGame(room);
    let gameData = gameCollection.gameData[room];
    log("Game: " + JSON.stringify(game));// LOG
    if (game){
        let n = game.playerCount;
        game.players[n] = createPlayer(socket.username);
        game.playerCount++;
        sendOpenedGameList();
        // send rules et games
        gameData.startTime = Date.now();
        socket.emit('rulesAndGame', { 
            rules: gameData.rules, 
            world: gameData.world, 
            currentTurn: gameData.currentTurn,
            startTime: gameData.startTime,
            playersInfos: gameData.getPlayersInfos()
        });
        // send action to do
        socket.emit('gameData', { 
            world: gameData.world, 
            currentTurn: gameData.currentTurn, currentAction: 
            gameData.currentAction ,
            playersInfos: gameData.getPlayersInfos()
        });
        // Alert other players
        io.to("/"+room).emit('player reconnect', {gameId: room, player: socket.username });
    }
});

// when the client emits 'game message', this listens and executes
socket.on('gameMessage', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.to("/"+data.room).emit('gameMessage', {
        username: data.username,
        message: data.message
    });
});

// when the client emits 'new message', this listens and executes
socket.on('new message', function (data) {
    if (data.indexOf("/") == 0 && data.length > 2) {
        let cmd = data.substring(1).toLowerCase().split(" ");
        let result = "Command '" + cmd + "' not found!";
        switch (cmd[0]) {
            // General commands
            case "date": result = new Date().toString(); break;
            case "time": result = new Date().toTimeString(); break;
            // Game commands
            default:
                // check if the user in in a game
                let game = null;
                let processingGameID = getProcessingGameOf(socket.username);
                if (processingGameID != null) game = gameCollection.gameData[processingGameID];
                switch (cmd[0]) {
                    case "playercount":
                        result = game != null ? game.playerCount : "No game found!";
                        break;
                    case "turn":
                        result = game != null ? game.currentTurn.turn : "No game found!";
                        break;
                    case "road":
                        result = game != null ? game.getCost("road") : "No game found!";
                        break;
                    case "settlement":
                        result = game != null ? game.getCost("settlement") : "No game found!";
                        break;
                    case "city":
                        result = game != null ? game.getCost("city") : "No game found!";
                        break;
                    case "card":
                        result = game != null ? game.getCost("devCard") : "No game found!";
                        break;
                    case "boat":
                        result = game != null ? game.getCost("boat") : "No game found!";
                        break;
                    case "knight":
                        result = game != null ? game.getCost("knight") : "No game found!";
                        break;
                    case "walls":
                    case "citywalls":
                        result = game != null ? game.getCost("cityWalls") : "No game found!";
                        break;
                    case "showpossiblebuilds":
                    case "spb":
                        if (game == null)
                            result = "No game found!";
                        else if (game.players && game.players[socket.username]) {
                            game.players[socket.username].opts.showPossibleBuilds = true;
                            result = game.players[socket.username].opts.showPossibleBuilds ? "Done." : "A problem occured.";
                            socket.emit("myDeck", game.players[socket.username]);
                        }                          
                        break;
                    case "hidepossiblebuilds":
                    case "hpb":
                        if (game == null)
                            result = "No game found!";
                        else if (game.players && game.players[socket.username]) {
                            game.players[socket.username].opts.showPossibleBuilds = false;
                            result = !game.players[socket.username].opts.showPossibleBuilds ? "Done." : "A problem occured.";
                            socket.emit("myDeck", game.players[socket.username]);
                        }
                        break;
                    case "change":
                        if (cmd.length > 1) {
                            switch (cmd[1]) {
                                case "color":
                                    if (cmd.length > 2) {
                                        game.players[socket.username].opts.mycolor = cmd[2];
                                        result = "Done.";
                                        socket.emit("myDeck", game.players[socket.username]);
                                    }
                                    break;
                            }
                        }
                        break;
                    case "reset":
                        if (cmd.length > 1) {
                            switch (cmd[1]) {
                                case "color":
                                    game.players[socket.username].opts.mycolor = -1;
                                    result = "Done.";
                                    socket.emit("myDeck", game.players[socket.username]);
                                    break;
                            }
                        }
                        break;
                }
        }
        socket.emit('new message', {
            time: Date.now(),
            username: socket.username,
            message: result
        });
    }
    else {
        let message = {
            time: Date.now(),
            username: socket.username,
            message: data
        }
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', message);
        // we want to keep history of all sent messages
        history.push(message);
        history = history.slice(-100);
    }

});

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    if (username in clients){
      socket.emit('username already exists', username);
      return;
    }

    socket.emit('add user', username);

    clients[username] = socket;

    // send back chat history
    if (history.length > 0) {
      socket.emit('chatHistory', history);
    }

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
    sendOpenedGameList();
    // check if the user in in a game
    let processingGameID = getProcessingGameOf(username);
    log("processingGameID " + processingGameID);// LOG
    if (processingGameID) socket.emit('automatic join game', processingGameID);
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      time: Date.now(),
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      delete clients[socket.username];
      let game = getGameOfPlayer(socket.username);
      if (game != null) {
        let i = 0
        for (i=0; i<game.playerCount; i++) 
          if (game.players[i].username == socket.username) break;
        game.players.splice(i, 1);
        game.playerCount--;
        log("w/ " + game.id + " " + socket.username + " leave game.");// LOG
        socket.emit('leftGame', { gameId: game['id'] });
        if (game.playerCount == 0) {
          // No players in the game: destroy it
          destroyGame(game);
          io.emit('gameDestroyed', {gameId: game['id'], gameOwner: socket.username });
        }
        else {
          // Alert other players 
          log("w/ " + game.id + " " + socket.username + " 'player disconnect'");// LOG
          io.to("/"+game.id).emit('player disconnect', {gameId: game.id, player: socket.username });
        }
        sendOpenedGameList();
      }

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

  //when the client requests to make a Game
  socket.on('makeGame', function (data) {
    log(JSON.stringify(gameCollection.gameList));// LOG
    let noGamesFound = true;
    for(let i = 0; i < gameCollection.totalGameCount; i++){
      let playerCount = gameCollection.gameList[i]['gameObject'].playerCount;
      for(let p = 0; p < playerCount; p++){
        let tempName = gameCollection.gameList[i]['gameObject'].players[p].username;
        if (tempName == socket.username){
          noGamesFound = false;
          log("This user already has a Game!");// LOG
          socket.emit('alreadyJoined', {
            gameId: gameCollection.gameList[i]['gameObject']['id']
          });
        }
      }
    }
    let options = data || { minPlayerCount: 3 }

    if (noGamesFound == true) {
      let playerObject = createPlayer(socket.username, 1)
      let gameObject = createGame(playerObject, options);
      gameObject.index = gameCollection.totalGameCount;
      gameCollection.totalGameCount ++;
      gameCollection.gameList.push({gameObject});
      log("w/" +  gameObject.id + " " + " created by "+ socket.username);// LOG
      io.emit('gameCreated', {
        username: socket.username,
        gameId: gameObject.id
      });
      sendOpenedGameList();
    }
  });

  socket.on('joinGame', function (data){
    log(socket.username + " wants to join a game");// LOG
    if (gameCollection.totalGameCount == 0 ) {
      socket.emit('noGameOpened');
      return;
    }
    let alreadyInGame = false;
    // already In Game ?
    let game = getGameOfPlayer(socket.username);
    if (game != null) {
      log(socket.username + " already has a Game!");// LOG
      socket.emit('alreadyJoined', {
        gameId: game['id']
      });
      alreadyInGame = true;
    }
    // no ?
    if (alreadyInGame == false){
      let gameObject = getGame(data.id);
      joinGame(socket.username, gameObject);
      socket.emit('joinSuccess', {
        gameId: gameObject['id'],
        playerName: socket.username
      });
      sendOpenedGameList();
    }
  });

  socket.on('leaveGame', function() {
    if (gameCollection.totalGameCount == 0){
       socket.emit('noGameOpened');
    }
    else {
      let game = getGameOfPlayer(socket.username);
      if (game == null) {
        socket.emit('notInGame');
      }
      else {
        let i = 0;
        for (i=0; i<game.playerCount; i++) {
          if (game.players[i].username == socket.username) break;
        }
        game.players.splice(i, 1);
        game.playerCount--;
        log("w/" + game['id'] + " " + socket.username + " leave game.");// LOG
        socket.emit('leftGame', { gameId: game['id'] });
        if (game.playerCount == 0) {
          destroyGame(game);
          io.emit('gameDestroyed', {gameId: game['id'], gameOwner: socket.username });
        }
        sendOpenedGameList();
      }
    }
  });

  socket.on('launchGame', function(data) {
    log("w/" + data.id + " " + socket.username + " wants to start game.");// LOG
    let game = getGame(data.id);
    if (game.canBeLaunch) {
      game.canBeLaunch = false;
      game.launched = true;
      sendOpenedGameList();
      io.emit('launchedGame', game);
    }
    else {
      log("w/" + data.id + "  Game can't be launched.");// LOG
    }
  });

  socket.on('getMyDeck', function(data) {
    log("w/" + data.gameId + " " + data.user + " wants his material/");// LOG
    log("Sending "+gameCollection.gameData[data.gameId].players[data.user].pieces.road+" roads... w/"+ data.gameId);// LOG
    socket.emit("myDeck", gameCollection.gameData[data.gameId].players[data.user]);
  });

  socket.on('gameAction', function(data) {
    /*
    user: username, 
    gameId: mygame.id,
    gameAction: gameAction,
    target: {
      type: tg._type,
      data: tg._data
    }*/
    let game = gameCollection.gameData[data.gameId];
    log("w/" + data.gameId + " " + socket.username + " wants to play.");// LOG

    // Check if it is a valid action
    if (game.canPlay(data.user, data.gameAction, data.target)) {
      
      // Broadcast "Game Message"
      io.to("/"+data.gameId).emit('gameMessage', { username: "GAME", message: data.user + " played " + data.gameAction.todo });
      log("w/" + data.gameId + " Playing...");// LOG
      
      // Broadcast choose of a player
      if (data.gameAction.todo == "SEND_CHOOSEN_RESOURCE_OF_MONOPOLY") {
        io.to("/"+data.gameId).emit('SEND_CHOOSEN_RESOURCE_OF_MONOPOLY', data);
      }

      // PLAY 
      game.play(data.user, data.gameAction, data.target);

      // Update each deck of the players
      for (let key in game.players) 
        if (key in clients) clients[key].emit('myDeck', game.players[key]);

      // Broadcast "Dice result"
      if (game.currentAction.todo == "PLAY" || game.currentAction.todo == "THIEF" || game.currentAction.todo == "MOVE_ROBBER") {
        io.to("/"+data.gameId).emit('dice result', {currentTurn: game.currentTurn});
      }
      // Broadcast "END OF GAME"
      else if (game.currentAction.todo == "VICTORY") {
        io.to("/"+data.gameId).emit('VICTORY', {winner: game.getWinner()});
      }

      log("w/" + data.gameId + " " + socket.username + " played.");// LOG
      log("w/" + data.gameId + " Turn " + game.currentAction.turn + ": " + game.currentAction.to.username + " -> " + game.currentAction.todo);// LOG
      
      // Update all game data
      io.to("/"+data.gameId).emit('gameData', { 
        world: game.world, 
        currentTurn: game.currentTurn, 
        currentAction: game.currentAction,
        playersInfos: game.getPlayersInfos(),
        currentTrades: game.getCurrentTrades()
       });
    }
    else {
      log("w/" + data.gameId + " " + data.user + " can't play :-(");// LOG
      socket.emit('gameMessage', { username: "GAME", message:  socket.username + ", you can't do it!" });
    }
  });


});

function sendOpenedGameList() {
  io.emit('openedGameList', gameCollection);
}
function getGameOfPlayer(username) {
  for(let i = 0; i < gameCollection.totalGameCount; i++){
    let playerCount = gameCollection.gameList[i]['gameObject'].playerCount;
    for(let p = 0; p < playerCount; p++){
      let tempName = gameCollection.gameList[i]['gameObject'].players[p].username;
      if (tempName == username){
        return gameCollection.gameList[i]['gameObject'];
      }
    }
  }
  return null;
}
// Create a game
function createGame(player, options) {
  let gameObject = {};
  gameObject.id = "Game_" + (Math.random()+1).toString(36).slice(2, 18);
  gameObject.players = [];
  gameObject.players[0] = player;
  gameObject.playerCount = 1;
  gameObject.minPlayerCount = options.minPlayerCount;
  gameObject.maxPlayerCount = 4;
  gameObject.canBeJoin = true;
  gameObject.launched = false;
  gameObject.canBeLaunch = gameObject.playerCount >= gameObject.minPlayerCount;
  gameObject.inRoom = 0;
  return gameObject;
}

// Create a player
function createPlayer(username) {
  let playerObject = {};
  playerObject.id = "Player_" + (Math.random()+1).toString(36).slice(2, 18);
  playerObject.username = username;
  return playerObject;
}

// Join a Game
function joinGame(username, game) {
  let n = game.playerCount;
  game.players[n] = createPlayer(username);
  game.playerCount++;
  game.canBeJoin = game.playerCount<game.maxPlayerCount;
  game.canBeLaunch = game.playerCount>=game.minPlayerCount && game.playerCount<=game.maxPlayerCount;
  log("w/" + game.id + " " + username + " joined game." );// LOG
}
// Destroy a Game
function destroyGame(game) {
  --gameCollection.totalGameCount;
  log("Destroy the Game!");// LOG
  gameCollection.gameList.splice(game.index, 1);
  gameCollection.gameData[game.id] = null;
  log(gameCollection.gameList);// LOG
}
function getGame(id) {
  for (let i=0; i<gameCollection.totalGameCount; i++)
    if (gameCollection.gameList[i]['gameObject'].id==id)
      return gameCollection.gameList[i]['gameObject'];
  return null;
}
function getProcessingGameOf(username) {
  for (let gameId in gameCollection.gameData)
    if (gameCollection.gameData[gameId])
      for (let playername in gameCollection.gameData[gameId].players)
        if (playername == username) return gameId;
  return null;
}
function log(text, param) {
  if (port == DEV_PORT) {
    if (param) console.log(text, param); else console.log(text);
  }
}
