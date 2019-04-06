// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var Soc = require('./soc');

server.listen(port, function () {
  console.log('Server listening at port %d', port);// LOG
});

// Routing
app.use(express.static(__dirname));

// Entire GameCollection Object holds all games and info

var gameCollection = new function() {
  this.totalGameCount = 0,
  this.gameList = [],
  this.gameData = {}
};

// Latest 100 messages
var history = [{
  time: Date.now(),
  username: "",
  message: "Server started."
} ];

// Chatroom

var numUsers = 0;
var clients = {};

io.on('connection', function (socket) {
  var addedUser = false;

  // once a client has connected, we expect to get a ping from them saying what room they want to join
  socket.on('room', function(room) {
    console.log(socket.username + " join room /" + room);// LOG
    socket.join("/"+room);
    //socket.broadcast.to("/"+room).emit('gameMessage', "You are in the game room. Let's play !");
    var game = getGameOfPlayer(socket.username);
    if (game){
      game.inRoom++;
      // All players in game room ?
      if (game.inRoom==game.playerCount) {
        io.to("/"+room).emit('gameMessage', { username: "GAME", message:  "You are in the game room. Let's play !" });
        // init Game
        gameCollection.gameData[room] = new Soc(game, {}); 
        var gameData = gameCollection.gameData[room];
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
          currentTurn: gameData.currentTurn, currentAction: 
          gameData.currentAction ,
          playersInfos: gameData.getPlayersInfos()
        });
      }
      console.log("in room " +  game.inRoom + "/" + game.playerCount);// LOG
    }
  });
  // once a client has reconnected, we expect to get a ping from them saying what room they want to join
  socket.on('join room', function(room) {
    console.log(socket.username + " join room /" + room);// LOG
    socket.join("/"+room);
    var game = getGame(room);
    var gameData = gameCollection.gameData[room];
    console.log("Game: " + JSON.stringify(game));// LOG
    if (game){
      var n = game.playerCount;
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
      socket.emit('gameData',  { 
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
    var message = {
      time: Date.now(),
      username:  socket.username,
      message: data
    };
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', message);
    // we want to keep history of all sent messages
    history.push(message);
    history = history.slice(-100);

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
    var processingGameID = getProcessingGameOf(username);
    console.log("processingGameID " + processingGameID);// LOG
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
      var game = getGameOfPlayer(socket.username);
      if (game != null) {
        var i = 0
        for (i=0; i<game.playerCount; i++) 
          if (game.players[i].username == socket.username) break;
        game.players.splice(i, 1);
        game.playerCount--;
        console.log("w/ " + game.id + " " + socket.username + " leave game.");// LOG
        socket.emit('leftGame', { gameId: game['id'] });
        if (game.playerCount == 0) {
          // No players in the game: destroy it
          destroyGame(game);
          io.emit('gameDestroyed', {gameId: game['id'], gameOwner: socket.username });
        }
        else {
          // Alert other players 
          console.log("w/ " + game.id + " " + socket.username + " 'player disconnect'");// LOG
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
    console.log(JSON.stringify(gameCollection.gameList));// LOG
    var noGamesFound = true;
    for(var i = 0; i < gameCollection.totalGameCount; i++){
      var playerCount = gameCollection.gameList[i]['gameObject'].playerCount;
      for(var p = 0; p < playerCount; p++){
        var tempName = gameCollection.gameList[i]['gameObject'].players[p].username;
        if (tempName == socket.username){
          noGamesFound = false;
          console.log("This user already has a Game!");// LOG
          socket.emit('alreadyJoined', {
            gameId: gameCollection.gameList[i]['gameObject']['id']
          });
        }
      }
    }
    var options = data || { minPlayerCount: 3 }

    if (noGamesFound == true) {
      var playerObject = createPlayer(socket.username, 1)
      var gameObject = createGame(playerObject, options);
      gameObject.index = gameCollection.totalGameCount;
      gameCollection.totalGameCount ++;
      gameCollection.gameList.push({gameObject});
      console.log("w/" +  gameObject.id + " " + " created by "+ socket.username);// LOG
      io.emit('gameCreated', {
        username: socket.username,
        gameId: gameObject.id
      });
      sendOpenedGameList();
    }
  });

  socket.on('joinGame', function (data){
    console.log(socket.username + " wants to join a game");// LOG
    if (gameCollection.totalGameCount == 0 ) {
      socket.emit('noGameOpened');
      return;
    }
    var alreadyInGame = false;
    // already In Game ?
    var game = getGameOfPlayer(socket.username);
    if (game != null) {
      console.log(socket.username + " already has a Game!");// LOG
      socket.emit('alreadyJoined', {
        gameId: game['id']
      });
      alreadyInGame = true;
    }
    // no ?
    if (alreadyInGame == false){
      var gameObject = getGame(data.id);
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
      var game = getGameOfPlayer(socket.username);
      if (game == null) {
        socket.emit('notInGame');
      }
      else {
        var i = 0
        for (i=0; i<game.playerCount; i++) {
          if (game.players[i].username == socket.username) break;
        }
        game.players.splice(i, 1);
        game.playerCount--;
        console.log("w/" + game['id'] + " " + socket.username + " leave game.");// LOG
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
    console.log("w/" + data.id + " " + socket.username + " wants to start game.");// LOG
    var game = getGame(data.id);
    if (game.canBeLaunch) {
      game.canBeLaunch = false;
      game.launched = true;
      sendOpenedGameList();
      io.emit('launchedGame', game);
    }
    else {
      console.log("w/" + data.id + "  Game can't be launched.");// LOG
    }
  });

  socket.on('getMyDeck', function(data) {
    console.log("w/" + data.gameId + " " + data.user + " wants his material/");// LOG
    console.log("Sending "+gameCollection.gameData[data.gameId].players[data.user].pieces.road+" roads... w/"+ data.gameId);// LOG
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
    var game = gameCollection.gameData[data.gameId];
    console.log("w/" + data.gameId + " " + socket.username + " wants to play.");// LOG

    // Check if it is a valid action
    if (game.canPlay(data.user, data.gameAction, data.target)) {
      
      // Broadcast "Game Message"
      io.to("/"+data.gameId).emit('gameMessage', { username: "GAME", message: data.user + " played " + data.gameAction.todo });
      console.log("w/" + data.gameId + " Playing...");// LOG
      
      // Broadcast choose of a player
      if (data.gameAction.todo == "SEND_CHOOSEN_RESOURCE_OF_MONOPOLY") {
        io.to("/"+data.gameId).emit('SEND_CHOOSEN_RESOURCE_OF_MONOPOLY', data);
      }

      // PLAY 
      game.play(data.user, data.gameAction, data.target);

      // Update each deck of the players
      for (var key in game.players) 
        if (key in clients) clients[key].emit('myDeck', game.players[key]);

      // Broadcast "Dice result"
      if (game.currentAction.todo == "PLAY" || game.currentAction.todo == "THIEF" || game.currentAction.todo == "MOVE_ROBBER") {
        io.to("/"+data.gameId).emit('dice result', {currentTurn: game.currentTurn});
      }
      // Broadcast "END OF GAME"
      else if (game.currentAction.todo == "VICTORY") {
        io.to("/"+data.gameId).emit('VICTORY', {winner: game.getWinner()});
      }

      console.log("w/" + data.gameId + " " + socket.username + " played.");// LOG
      console.log("w/" + data.gameId + " Turn " + game.currentAction.turn + ": " + game.currentAction.to.username + " -> " + game.currentAction.todo);// LOG
      
      // Update all game data
      io.to("/"+data.gameId).emit('gameData', { 
        world: game.world, 
        currentTurn: game.currentTurn, 
        currentAction: game.currentAction,
        playersInfos: game.getPlayersInfos()
       });
    }
    else {
      console.log("w/" + data.gameId + " " + data.user + " can't play :-(");// LOG
      socket.emit('gameMessage', { username: "GAME", message:  socket.username + ", you can't do it!" });
    }
  });


});

function sendOpenedGameList() {
  io.emit('openedGameList', gameCollection);
}
function getGameOfPlayer(username) {
  for(var i = 0; i < gameCollection.totalGameCount; i++){
    var playerCount = gameCollection.gameList[i]['gameObject'].playerCount;
    for(var p = 0; p < playerCount; p++){
      var tempName = gameCollection.gameList[i]['gameObject'].players[p].username;
      if (tempName == username){
        return gameCollection.gameList[i]['gameObject'];
      }
    }
  }
  return null;
}
// Create a game
function createGame(player, options) {
  var gameObject = {};
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
  var playerObject = {};
  playerObject.id = "Player_" + (Math.random()+1).toString(36).slice(2, 18);
  playerObject.username = username;
  return playerObject;
}

// Join a Game
function joinGame(username, game) {
  var n = game.playerCount;
  game.players[n] = createPlayer(username);
  game.playerCount++;
  game.canBeJoin = game.playerCount<game.maxPlayerCount;
  game.canBeLaunch = game.playerCount>=game.minPlayerCount && game.playerCount<=game.maxPlayerCount;
  console.log("w/" + game.id + " " + username + " joined game." );// LOG
}
// Destroy a Game
function destroyGame(game) {
  --gameCollection.totalGameCount;
  console.log("Destroy the Game!");// LOG
  gameCollection.gameList.splice(game.index, 1);
  gameCollection.gameData[game.id] = null;
  console.log(gameCollection.gameList);// LOG
}
function getGame(id) {
  for (var i=0; i<gameCollection.totalGameCount; i++)
    if (gameCollection.gameList[i]['gameObject'].id==id)
      return gameCollection.gameList[i]['gameObject'];
  return null;
}
function getProcessingGameOf(username) {
  for (var gameId in gameCollection.gameData)
    if (gameCollection.gameData[gameId])
      for (var playername in gameCollection.gameData[gameId].players)
        if (playername == username) return gameId;
  return null;
}

