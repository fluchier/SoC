$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $gameMessages = $('.gameMessages'); // Game messages area
  var $logs = $('.logs'); // Logs area
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.game.page'); // The chatroom page
  var $createGame = $('.createGame'); 
  var $leaveGame = $('.leaveGame');
  var $rooms = $('.rooms');

  // DEV
  var $allowOnePlayer = $('#allowOnePlayer');
  var $autoRollDice = $('#autoRollDice');


  var canvas = new fabric.Canvas('canvas_world'),
          f = fabric.Image.filters;;  

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var mygame = null;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  // Game
  var catan = {
    build: true,
    gameStartTime: 0,
    turnStartTime: 0,
    world: {
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
      ]
    },
  };
  var playerDeck;
  var gameAction;
  var disconnectedPlayers = [];
  var disconnectedPlayerTimer = [];
  var gameIntervalId = null;
  var turnIntervalId = null;

  // game buttons

  // My Panel infos
  var $turnText = $('.turn > span')
  var $myScoreText = $('.myScore > span');
  var $myKnightText = $('.knight > span');
  var $myVictoryPointText = $('.victoryPoint > span');
  var $myLongestRoadText = $('.longestRoad > span');
    // My Panel buttons
  var $rollDice = $('.rollDice');
  var $openTradingCard = $('.openTradingBank');
  var $endTrading = $('.endTrading');
  var $build = $('.build');
  var $buyDevCard = $('.buyDevCard');
  var $playKnight = $('.play_knight');
  var $playVictoryPoint = $('.play_victoryPoint');
  var $playRoadBuilding = $('.play_roadBuilding');
  var $playMonopoly = $('.play_monopoly');
  var $playYearOfPlenty = $('.play_yearOfPlenty');
  var $endTurn = $('.endTurn')
  
  // All players Panel
  var $playerPanel = $('#allPlayers');

  // modals
  var $thiefResourcesModal = $('#thiefResourcesModal');
  var $returnCard = $('.returnCard');
  var $sendResourcesToBank = $('.sendResources');

  var $tradeModal = $('#tradeModal');
  var $tradeCard = $('.tradeCard');
  var $confirmTradeToBank = $('.confirmTradeToBank');
  var $cancelTradeToBank = $('.cancelTradeToBank');

  var $yearOfPlentyModal = $('#yearOfPlentyModal');
  var $chooseCardForYearOfPlenty = $('.chooseCardForYearOfPlenty');
  var $confirmChoosenCardForYearOfPlenty = $('.confirmChoosenCardForYearOfPlenty');

  var $monopolyModal = $('#monopolyModal');
  var $chooseResourceForMonopoly = $('.chooseResourceForMonopoly');
  var $confirmChoosenResourceOfMonopoly = $('.confirmChoosenResourceOfMonopoly');

  // COM
  var socket = io();

  if (localStorage.getItem('Free-SoC-autologin')) {
    $usernameInput.val(localStorage.getItem('Free-SoC-autologin'));
    //socket.emit('add user', localStorage.getItem('Free-SoC-autologin')); 
  }

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "It's Just YOU and ME -Robot";
    } else {
      message += "there are " + data.numUsers + " players in the Lobby";
    }
    log(message);
  }

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());
    // If the username is valid
    if (username) {
      // Tell the server your username
      socket.emit('add user', username); 

      // Draw decor island
      var size = 50, dx = 360, dy = 5 * size + 17;
      for (var t=0; t<catan.world.tiles.length; t++) {
        drawTile(
          size, 
          dx + catan.world.tiles[t].x * 0.75 * size, 
          dy + catan.world.tiles[t].y * size * Math.sin(2 * Math.PI / 6),
          catan.world.tiles[t]
        );
      }
    }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        time: Date.now(),
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      if (mygame!=null && mygame.launch)
        socket.emit('gameMessage', {
          username: username,
          message: message,
          room: mygame.id
        });
      else
        socket.emit('new message', message);
    }
  }
  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options, $logs);
  }
  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));

    var dt = new Date(data.time);
    var $dtDiv = $('<span class="chatdate"/>').text( '@'
      + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
      + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) + ' ');
      
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($dtDiv, $usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options, $messages);
  }
  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }
  function addRoom (data, options) {
    options = options || {};

    var $players = $('<div class="players"> </div>');
    mygame = null;
    for (var i=0; i<data.maxPlayerCount; i++) {
      var $player = $('<span class="player username" />').text("Free place").css('color', 'gray').css('font-style', 'italic');
      if (i<data.playerCount) {
        $player.text("Player : "+data.players[i].username)
        .css('color', getUsernameColor(data.players[i].username)).css('font-style', 'normal');
        if (username == data.players[i].username) {
          mygame = data;
          $leaveGame.prop('disabled', false);
        }
      }
      $players.append($player);
    }

    var $joinOrLaunchGame = $('<button class="joinOrLaunchGame tooltip"/>').attr('title', 'Join this game').text("Join Game").click(function () {joinGame(data)});
    if (!data.canBeJoin || mygame!=null) {
      $joinOrLaunchGame.prop('disabled', true);
    }

    if (mygame!=null && mygame.id==data.id) {
      $joinOrLaunchGame.text("Start Game").attr('title', 'You must be at least ' + data.minPlayerCount + ' players to start the game').prop('disabled', !data.canBeLaunch).click(function () {launchGame(data)});
      if(data.launched) {
        $joinOrLaunchGame.attr('title', 'This game has already started!').text("In progress");
      }
    }
    var $messageDiv = $('<li class="room"/>')
      .data('room', data)
      .append("<span class='gameId'>"+data.id.substring(4)+"</span>", $joinOrLaunchGame, $players);
    addMessageElement($messageDiv, options, $rooms);
  }


  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options, msgs) {
    var $el = $(el);
    // Setup default options
    if (!options) options = {};
    if (typeof options.fade === 'undefined') options.fade = true;
    if (typeof options.prepend === 'undefined') options.prepend = false;
    // Apply options
    if (options.fade) $el.hide().fadeIn(FADE_TIME);
    if (options.prepend) msgs.prepend($el); else msgs.append($el);
    msgs[0].scrollTop = msgs[0].scrollHeight;
  }
  function addChatGameMessage (data, options) {
    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .append($usernameDiv, $messageBodyDiv);
    addMessageElement($messageDiv, options, $gameMessages);
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    if (!username || username == "") username = "Undefined!";
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  $createGame.click(function () {
    sendGame();
  });
  $leaveGame.click(function () {
    leaveGame();
  });

  $build.click(function(){
    catan.build = !catan.build;
    if (catan.build) $build.text("Cancel Build"); else $build.text("Build");
  });
  $sendResourcesToBank.click(function(){
    sendResourcesToBank();
    $returnCard.unbind("click");
    $thiefResourcesModal.css('display', 'none');
  });
  var rscsClass = [ "lumber", "bricks", "wool", "grain", "ore"];
  $('#tradeImage').click(function(){
    var rsc = rscsClass.shift();
    $(this).removeClass(function() {
      return $( this ).attr( "class" );
    }).addClass(rsc + "Image").attr("data-rsc", rsc);
    rscsClass.push(rsc);
  });
  $confirmTradeToBank.click(function(){
    sendTradeToBank();
    $tradeCard.unbind("click");
    $tradeModal.css('display', 'none');
  });
  $cancelTradeToBank.click(function(){
    $tradeCard.unbind( "click" );
    $tradeModal.css('display', 'none');
    socket.emit('getMyDeck', {user: username, gameId: mygame.id});
  });
  $confirmChoosenCardForYearOfPlenty.click(function(){
    sendChoosenCardOfYearOfPlenty();
    $chooseCardForYearOfPlenty.unbind("click");
    $yearOfPlentyModal.css('display', 'none');
  });
  $confirmChoosenResourceOfMonopoly.click(function(){
    sendChoosenResourceOfMonopoly();
    $chooseResourceForMonopoly.unbind("click");
    $monopolyModal.css('display', 'none');
  });
  $buyDevCard.click(function(){
    buyDevCard();
  });
  $openTradingCard.click(function(){
    showTradePanel();
  });
  $playKnight.click(function(){
    playKnight();
  });
  $playRoadBuilding.click(function(){
    playRoadBuilding();
  });
  $playVictoryPoint.click(function(){
    playVictoryPoint();
  });
  $playMonopoly.click(function(){
    playMonopoly();
  });
  $playYearOfPlenty.click(function(){
    playYearOfPlenty();
  });
  $rollDice.click(function () {
    rollDice();
  });
  $endTrading.click(function () {
    endTrading();
  });
  $endTurn.click(function () {
    endTurn();
  });


  // Socket events
 
  socket.on('automatic join game', function (data) {
    //alert("Joining... " + data);
    socket.emit('join room', data);
  });

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to the Game Server of Free-SoC 1.0.0 (BETA) - 2019/04/03";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
    if ($('#rememberMe').is(':checked')) localStorage.setItem('Free-SoC-autologin', username);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('gameMessage', function (data) {
    addChatGameMessage(data);
  });


  // Whenever the server emits 'username already exists', alert it
  socket.on('username already exists', function(data) {
    username = null;
    alert("This username '" + data + "' already exists.");
  });
  socket.on('chatHistory', function(messages) {
    for(var m=0; m<messages.length; m++)
      addChatMessage(messages[m]);
  });
  // Whenever the server emits 'username already exists', alert it
  socket.on('add user', function(data) {
    $loginPage.fadeOut();
    $chatPage.show();
    $loginPage.off('click');
    $currentInput = $inputMessage.focus();
  });
  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });
  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });
  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });


  // Client Controller

  function sendGame(){
    var gameOptions = {};
    if ($allowOnePlayer.is(':checked')) {
      gameOptions = { minPlayerCount: 1 };
    }
    socket.emit('makeGame', gameOptions);
  };
  socket.on('noGameOpened', function () {
    log('No opened Game');
  });
  socket.on('gameCreated', function (data) {
    console.log("Game Created! ID is: " + data.gameId);
    log(data.username + ' created Game: ' + data.gameId);
    //alert("Game Created! ID is: "+ JSON.stringify(data));
  });

  socket.on('openedGameList', function (data) {
    console.log(data.totalGameCount + " opened Game.");
    $rooms.empty().css('text-align', 'left');
    if (data.totalGameCount == 0) $rooms.text('No games in progress! Create yours.').prepend('<br>').css('text-align', 'center');
    for (var i=0; i<data.totalGameCount; i++){
      console.log("Game: " + data.gameList[i]["gameObject"]);
      addRoom(data.gameList[i]["gameObject"]);
    }
  });

  //Join into an Existing Game
  function joinGame(data){
    socket.emit('joinGame', data);
  };
  socket.on('joinSuccess', function (data) {
    log(data.playerName + ' joined the following game: ' + data.gameId);
  });

  //Response from Server on existing User found in a game
  socket.on('alreadyJoined', function (data) {
    log('You are already in an Existing Game: ' + data.gameId);
  });

  function leaveGame(){
    socket.emit('leaveGame');
  };
  socket.on('leftGame', function (data) {
    $leaveGame.prop('disabled', true);
    log('Leaving Game ' + data.gameId);
  });

  socket.on('player disconnect', function (data) {
    //alert(data.player + " is disconnected!");
    var start = Date.now();
    disconnectedPlayers[data.player] = start;
    $playerPanel.find('._p_' + data.player).find('.playerPanelStatus')
        .addClass('disconnectedPlayer')
        .text("DISCONNECTED");
    disconnectedPlayerTimer[data.player] = setInterval(function() {
      $playerPanel.find('._p_' + data.player).find('.playerPanelStatus')
          .text("DISCONNECTED " + getElapsedTime(start));
    }, 1000);

  });

  socket.on('player reconnect', function (data) {
    //alert(data.player + " is connected!");
    delete disconnectedPlayers[data.player];
    $playerPanel.find('._p_' + data.player).find('.playerPanelStatus')
        .removeClass('disconnectedPlayer')
        .text("");
    clearTimeout(disconnectedPlayerTimer[data.player]);
  });

  socket.on('notInGame', function () {
    log('You are not currently in a Game.');
  });
  socket.on('gameDestroyed', function (data) { 
    log( data.gameOwner+ ' destroyed game: ' + data.gameId);
  });
  function launchGame(data) {
    log('Try launching game ' + data.id);
    socket.emit('launchGame', data);
  };
  socket.on('launchedGame', function (data) {
    log('Launching Game ' + data.id);
    if (data.id == mygame.id) {
      for(var i = 0; i < data.playerCount; i++){
        if (data.players[i].username == username){
          $gameMessages.empty();
          socket.emit('room', data.id);
        }
      }
    }
  });
  function updateGameChrono() {
    // Game Chrono
    $(".chrono > .general").text( getElapsedTime(catan.gameStartTime) );
    // Turn Chrono
    if (isMyTurn())
      $(".chrono > .myTurn").text( getElapsedTime(catan.turnStartTime) );
  }
  function getElapsedTime(from) {
    var elapsed = Math.floor((Date.now() - from) / 1000);
    var text = "";
    var h = Math.floor(elapsed / 3600);
    var m = Math.floor((elapsed % 3600) / 60);
    var s = elapsed - 3600 * h - 60 * m;
    if (h>0) text = h + ":";
    if (m<10) text = text + "0" + m + ":"; else text = text + m + ":";
    if (s<10) text = text + "0" + s; else text = text + s;
    return text;
  }

  socket.on('rulesAndGame', function (data) {
    addChatGameMessage({username: "", message: "Rules & game transfered."});
    catan.rules = data.rules;
    catan.world = data.world; 
    catan.currentTurn = data.currentTurn;

    catan.gameStartTime = data.startTime;
    gameIntervalId = setInterval(updateGameChrono, 1000);

    // Draw world
    canvas.clear();
    var size = 50, dx = 360, dy = 5 * size + 17;
    for (var t=0; t<catan.world.tiles.length; t++) {
      drawTile(
        size, 
        dx + catan.world.tiles[t].x * 0.75 * size, 
        dy + catan.world.tiles[t].y * size * Math.sin(2 * Math.PI / 6),
        catan.world.tiles[t]
      );
    }
    for (var r=0; r<catan.world.roads.length; r++) {
      drawRoad(
        size,
        dx + catan.world.roads[r].nodes[0].i * 0.75 * size,
        dy + catan.world.roads[r].nodes[0].j * size * Math.sin(2 * Math.PI / 6),
        dx + catan.world.roads[r].nodes[1].i * 0.75 * size,
        dy + catan.world.roads[r].nodes[1].j * size * Math.sin(2 * Math.PI / 6),
        catan.world.roads[r]
      );
    }
    for (var n=0; n<catan.world.nodes.length; n++) {
      drawNode(
        size, 
        dx + catan.world.nodes[n].i * 0.75 * size, 
        dy + catan.world.nodes[n].j * size * Math.sin(2 * Math.PI / 6),
        catan.world.nodes[n]
      );
    }
    socket.emit('getMyDeck', {user: username, gameId: mygame.id});
    
    // Create Players Panel
    createPlayersPanels(data.playersInfos);
  });
  socket.on('myDeck', function (data) {
    playerDeck = data;
    $myScoreText.text(playerDeck.score + " / " + catan.rules.victoryPoint);
    $myKnightText.text(playerDeck.devCards.played.knight);
    $myVictoryPointText.text(playerDeck.devCards.played.victoryPoint);
    $myLongestRoadText.text(playerDeck.longestRoad);
    updateResourcesPanel();
    updateDevsCardsButtons(playerDeck.devCards.toPlay);
  });

  socket.on('SEND_CHOOSEN_RESOURCE_OF_MONOPOLY', function (data) {
    console.log(JSON.stringify(data));
    showMessage(" played “Moopoly“ on " , 3000);
  });

  socket.on('gameData', function (data) {

    catan.world = data.world; 
    catan.currentTurn = data.currentTurn;
    gameAction = data.currentAction;

    console.log("====== gameData ======");
    console.log(JSON.stringify(data.playersInfos));
    console.log(JSON.stringify(gameAction));
    console.log(JSON.stringify(catan.currentTurn));

    // Update turn display et Players panel
    $turnText.text(catan.currentTurn.turn);
    updatePlayersPanels(data.playersInfos, gameAction, catan.currentTurn);

    // Update model of world
    for (var i=0; i<catan.world.tiles.length; i++) {
      updateTile(catan.world.tiles[i]);
    }
    for (var n=0; n<catan.world.nodes.length; n++) {
      updateNode(catan.world.nodes[n]);
    }
    for (var r=0; r<catan.world.roads.length; r++) {
      updateRoad(catan.world.roads[r]);
    }
    // and redraw world
    canvas.renderAll();

    // Disable all game buttons
    $(".gameButtons").find("button").prop('disabled', true);

    // Have i to play ?
    if (gameAction.todo == "THIEF" && playerDeck.resourceCount > playerDeck.resourceLimit) {
      showThiefPanel();
    }
    else {
      if (isMyTurn()) {
        if (gameAction.todo == "SETTLEMENT" || gameAction.todo == "CITY" || gameAction.todo == "ROLL_DICE")
          catan.turnStartTime = Date.now();
        addChatGameMessage({username: "TURN " + catan.currentTurn.turn , message: username + "! It's up to you to play: " + gameAction.todo});
        if (playerDeck) updateDevsCardsButtons(playerDeck.devCards.toPlay);
        switch (catan.currentTurn.phase) {
          case "ROLL_DICE": 
            $rollDice.prop('disabled', false);
            if ($autoRollDice.is(':checked')) rollDice();
          break;
          case "TRADING": 
            $openTradingCard.prop('disabled', false);
            $endTrading.prop('disabled', false);
          break;
          case "BUILDING": 
            catan.build = false;
            $build.text("Build");
            $build.prop('disabled', false);
            $buyDevCard.prop('disabled', false);
            $endTurn.prop('disabled', false);
          break;
        }
        
        if (gameAction.todo == "MOVE_ROBBER"){
          $(".gameButtons").find("button").prop('disabled', true);
          showMessage("You have to move the robber.", 3000);
        }
        else if (gameAction.todo == "CHOOSE_YEAR_OF_PLENTY") {
          $(".gameButtons").find("button").prop('disabled', true);
          openYearOfPlenty();
        }
        else if (gameAction.todo == "CHOOSE_MONOPOLY") {
          $(".gameButtons").find("button").prop('disabled', true);
          openMonopoly();
        }
        switch(gameAction.todo) {
          case "SETTLEMENT":
            catan.build = true;
            $build.prop('disabled', true);
            showMessage("You have to place a settlement.", 3000);
            break;
          case "ROAD":
            catan.build = true;
            $build.prop('disabled', true);
            showMessage("You have to place a road.", 3000);
            break;
          case "CITY":
            catan.build = true;
            $build.prop('disabled', true);
            showMessage("You have to place a city.", 3000);
            break;
        }
      }
      else {
        addChatGameMessage({username: "TURN " + catan.currentTurn.turn, message: "It's up to " + gameAction.to.username + " to play..."});
        switch (gameAction.toto) {
          case "CHOOSE_MONOPOLY": 
            showMessage(gameAction.to.username + " play “Monopoly“", 3000)
          break;
        }
      }
    }

  });

  socket.on('dice result', function (data) {
    catan.currentTurn = data.currentTurn;
    var diceResult = catan.currentTurn.dice1 + catan.currentTurn.dice2;
    addChatGameMessage({username: "TURN " + catan.currentTurn.turn , message: "Dice result: " + diceResult});
    //showMessage(catan.currentTurn.dice1 + " & " + catan.currentTurn.dice2, 20000);
    $("#dice1").removeClass(function() {
      return $( this ).attr( "class" );
    }).addClass("dice" + catan.currentTurn.dice1);
    $("#dice2").removeClass(function() {
      return $( this ).attr( "class" );
    }).addClass("dice" + catan.currentTurn.dice2);
    if (diceResult == 7)
      $(".dices > DIV").css('background-color', 'red');
    else
      $(".dices > DIV").css('background-color', 'white');
    
  });

  socket.on('VICTORY', function (data) {
    catan.currentTurn = data.currentTurn;
    var diceResult = catan.currentTurn.dice1 + catan.currentTurn.dice2;
    addChatGameMessage({username: "GAME", message: data.username + " is the winner!"});
    showMessage(data.username + " is the winner!", 50000);
  });
  
  // Controllers

  function buyDevCard() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "BUY_DEV_CARD"
    });
  }
  function sendResourcesToBank() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "SEND_RSRC_TO_BANK",
      resourcesToReturn: playerDeck.resourcesToReturn
    });
  }
  function sendTradeToBank() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "TRADE_RSRC_WITH_BANK",
      trades: playerDeck.trades
    });
  }
  function sendChoosenCardOfYearOfPlenty() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "SEND_CHOOSEN_CARDS_OF_YEAR_OF_PLENTY",
      yearOfPlentyChoosenCards: playerDeck.yearOfPlentyChoosenCards
    });
  }
  function sendChoosenResourceOfMonopoly() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "SEND_CHOOSEN_RESOURCE_OF_MONOPOLY",
      monopolyChoosenResource: playerDeck.monopoly
    });
  }
  
  function playKnight() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_KNIGHT"
    });
  }
  function playRoadBuilding() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_ROAD_BUILDING"
    });
  }
  function playVictoryPoint() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_VICTORY_POINT"
    });
  }
  function playMonopoly() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_MONOPOLY"
    });
  }
  function playYearOfPlenty() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_YEAR_OF_PLENTY"
    });
  }
  function rollDice() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "ROLL_DICE"
    });
  }
  function endTrading() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "END_TRADING"
    });
  }
  function endTurn() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "END_TURN"
    });
  }
  function play(userAction) {
    socket.emit('gameAction', {
      user: username, 
      gameId: mygame.id,
      gameAction: userAction
    });
  }

  /*
  canvas.on('mouse:wheel', function(opt) {
    var delta = opt.e.deltaY;
    var pointer = canvas.getPointer(opt.e);
    var zoom = canvas.getZoom();
    zoom = zoom + delta/200;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
*/
canvas.on('mouse:down', function(options) {
  if (options.target) {
    var tg = options.target;
    console.log("You're click on ", tg._type);
    console.log('data: ', tg._data);
    // SPECIAL TURN
    if (catan.currentTurn.turn <= catan.rules.specialTurnCount && isMyTurn()) {
      socket.emit('gameAction', {
        user: username, 
        gameId: mygame.id,
        gameAction: gameAction,
        target: {
          type: tg._type,
          data: tg._data
        }
      });
    }
    // NORAM TURN
    else {
      switch (tg._type) {
        case "tile":
          socket.emit('gameAction', {
            user: username, 
            gameId: mygame.id,
            gameAction: gameAction,
            target: {
              type: tg._type,
              data: tg._data
            }
        });
          break;
        case "road": 
          if(isMyTurn()){
            if (gameAction.todo == "SPECIAL_ROAD_1" || gameAction.todo == "SPECIAL_ROAD_2"){
              socket.emit('gameAction', {
                user: username, 
                gameId: mygame.id,
                gameAction: gameAction,
                target: {
                  type: tg._type,
                  data: tg._data
                }
              });
            }
            else if (catan.build) {
              $build.prop('disabled', false);
              gameAction.todo = "BUY_ROAD";
              socket.emit('gameAction', {
                user: username, 
                gameId: mygame.id,
                gameAction: gameAction,
                target: {
                  type: tg._type,
                  data: tg._data
                }
              });
              catan.build = false;
              $build.text("Build");
            }
          }
          break;
        case "node": 
          if(isMyTurn() && catan.build){
            $build.prop('disabled', false);
            gameAction.todo == "";
            if (tg._data.build.type == 0) gameAction.todo = "BUY_SETTLEMENT";
            else if (tg._data.build.type == 1) gameAction.todo = "BUY_CITY";
            socket.emit('gameAction', {
              user: username, 
              gameId: mygame.id,
              gameAction: gameAction,
              target: {
                type: tg._type,
                data: tg._data
              }
            });
            catan.build = false;
            $build.text("Build");
          }
          break;
        default:
        }
    }
  }
});
canvas.on('mouse:over', function(options) {
  if (options.target) {
    var tg = options.target;
    //console.log("You're over a ", tg._type); console.log('data: ', tg._data);
    switch (tg._type) {
      case "tile":
        tg.item(0).set('opacity', 1);
        if (isMyTurn() && gameAction.todo == "MOVE_ROBBER") {
          //tg.item(0).filters['kodachrome'] = new f.Kodachrome();
          //tg.item(0).applyFilters();
          if (tg._data.type == 'SEA' || (tg._data.x == catan.world.robber.x && tg._data.y == catan.world.robber.y)) 
            tg.item(0).set('stroke', "red"); 
          else 
            tg.item(0).set('stroke', "green");
          tg.item(0).set('strokeWidth', 4);
        }
        break;
      case "node": 
        if (isMyTurn() && catan.build 
        && (gameAction.todo == "SETTLEMENT" || gameAction.todo == "CITY" || gameAction.todo == "PLAY")) {
          tg.item(0).set('fill', getUsernameColor(username));
          tg.set('opacity', .8);
          tg.item(0).set('strokeWidth', 1);
        }
        break;
      case "road":
        if (isMyTurn() && tg._data.player.index == -1)
          if ( (catan.build && (gameAction.todo == "ROAD" || gameAction.todo == "PLAY")) || gameAction.todo == "SPECIAL_ROAD_1" || gameAction.todo == "SPECIAL_ROAD_2") {
            tg.set('stroke', getUsernameColor(username));
            //tg.set('opacity', .8);
            tg.set('strokeWidth', 11);
          }
        break;
      default:
    }
    canvas.renderAll();
  }
});
canvas.on('mouse:out', function(options) {
  if (options.target) {
    var tg = options.target;
    //console.log("You're out a ", tg._type);  console.log('data: ', tg._data);
    switch (tg._type) {
      case "tile":
        tg.item(0).set('opacity', .9);
        tg.item(0).set('strokeWidth', 0);
        break;
      case "node":
        tg.item(0).set('fill', 'rgba(0,0,0,0)');
        tg.item(0).set('strokeWidth', 0);
        break;
      case "road":
        if (tg._data.player.index == -1) {
          tg.set('stroke', 'rgba(250,250,250,0)');
        }
        else {
          tg.set('stroke', getUsernameColor(tg._data.player.username));
          tg.set('opacity', 1);
        }
      break;
      default:
    }
    canvas.renderAll();
  }

});

// Create world 

function loadPattern(url, target, size) {
  fabric.Image.fromURL(url, function(img) {
  img.scaleToWidth(size);
  var patternSourceCanvas = new fabric.StaticCanvas();
    patternSourceCanvas.add(img);
    patternSourceCanvas.renderAll();
    var pattern = new fabric.Pattern({
      source: function() {
        patternSourceCanvas.setDimensions({
          width: img.getScaledWidth() + 1 , height: img.getScaledHeight() + 1
        });
        patternSourceCanvas.renderAll();
        return patternSourceCanvas.getElement();
      },
      repeat: 'repeat'
    });
    target.set('fill', pattern);
    canvas.renderAll();
  });
}

function drawTile (size, _x, _y, tile) {

  // robber
  var robber = new fabric.Circle({
    radius: size / 4, stroke: 'white', fill: 'black', opacity: 0,
    left: _x + size / 2, top: _y + size / 4,
    selectable: false, objectCaching: false 
  });

  var robber2 = new fabric.Circle({
    radius: size / 4, stroke: 'black', fill: 'purple',
    left: size / 2, top: size / 4
  });
  if (tile.x == catan.world.robber.x && tile.y == catan.world.robber.y) {
    robber.set("opacity", 1);
  }
  // hex 
  var hex = new fabric.Polygon([
    {x: size * Math.cos(0 * 2 * Math.PI / 6), y: size * Math.sin(0 * 2 * Math.PI / 6)},
    {x: size * Math.cos(1 * 2 * Math.PI / 6), y: size * Math.sin(1 * 2 * Math.PI / 6)},
    {x: size * Math.cos(2 * 2 * Math.PI / 6), y: size * Math.sin(2 * 2 * Math.PI / 6)},
    {x: size * Math.cos(3 * 2 * Math.PI / 6), y: size * Math.sin(3 * 2 * Math.PI / 6)},
    {x: size * Math.cos(4 * 2 * Math.PI / 6), y: size * Math.sin(4 * 2 * Math.PI / 6)},
    {x: size * Math.cos(5 * 2 * Math.PI / 6), y: size * Math.sin(5 * 2 * Math.PI / 6)} 
  ], {
    originX: 'center', originY: 'center', stroke: 'black', strokeWidth: 0, opacity: 0.9,
    selectable: false, objectCaching: false
  });
  switch(tile.type) {
    case "DESERT": loadPattern('assets/tiles/desert.png', hex, size); break;
    case "FOREST": loadPattern('assets/tiles/forest.png', hex, size); break;
    case "PASTURE": loadPattern('assets/tiles/pasture.png', hex, size); break;
    case "HILLS": loadPattern('assets/tiles/hills.png', hex, size); break;
    case "FIELDS": loadPattern('assets/tiles/fields.png', hex, size); break;
    case "MOUNTAINS": loadPattern('assets/tiles/mountains.png', hex, size); break;
    case "SEA": loadPattern('assets/tiles/sea.png', hex, size); break;
    default: loadPattern('assets/test.jpg', hex, size); break;
  }
  // tile = hex & robber
  var gtile = new fabric.Group([ hex/*, robber2*/], {
    left: _x, top: _y,
    selectable: false, objectCaching: false
  });

  gtile.set('_type', "tile");
  gtile.set('_data', tile);
  canvas.add(gtile);
  robber.set('_type', "robber");
  robber.set('_data', tile);
  canvas.add(robber);

  var lsize = size / 2;
  var dx = _x + size - lsize / 2;
  var dy = _y + size - 3 * lsize / 4;

  if (tile.type == 'SEA' && tile.harbor != "no") {
    var seaHarbor = new fabric.Circle({
      radius: lsize / 2, stroke: 'black', fill: 'white', opacity: .8,
      originX: 'center', originY: 'center'
    });
    if (tile.harbor == "*") loadPattern('assets/harbors/Harbor.png', seaHarbor, lsize / 2);
    else loadPattern('assets/harbors/' + tile.harbor + '.png', seaHarbor, lsize / 2);
    gtile.add(seaHarbor);
  }

  if (tile.type != 'DESERT' && tile.type != 'SEA') { // add token
    var circle = new fabric.Circle({
      radius: lsize / 2, stroke: 'black', fill: 'white', 
      originX: 'center', originY: 'center', opacity: .6,
    });
    var text = new fabric.Text(""+tile.value, {
      fontSize: 12, fontWeight: 200,
      strokeWidth: 1,
      color: 'black', stroke: 'black',
      originX: 'center', originY: 'center'
    });
    switch(tile.value) {
      case 2:
      case 12:
        text.set('fontSize', 9);
        break;
      case 3:
      case 11:
        text.set('fontSize', 11);
        break;
      case 4:
      case 10:
        text.set('fontSize', 12);
        break;
      case 5:
      case 9:
        text.set('fontSize', 13);
        break;
      case 6:
      case 8:
        text.set('fontSize', 16);
        text.set('color', 'red');
        text.set('stroke', 'red');
        break;
      default:
        text.set('color', 'purple');
        text.set('fontSize', 14);

    }
    var token = new fabric.Group([ circle, text ], {
      left: dx, top: dy,
      selectable: false, objectCaching: false, evented: false
    });
    token.set('_type', "token");
    token.set('_data', tile.value);

    canvas.add(token);
  }
}
function drawNode (size, _x, _y, node) {
  var lsize = size / 2;
  var dx = _x + size - 3 * lsize / 4;
  var dy = _y + size - 5 * lsize / 4;
  if (nodeIsAtRight(node.i, node.j))
    dx = dx + lsize / 2;
  else
    dx = dx - lsize / 2;
  var nodeCircle = new fabric.Circle({
    radius: lsize / 2.5, fill: 'rgba(0,0,0,0)', stroke: 'black', strokeWidth: 0,
    originX: 'center', originY: 'center',
    selectable: false, objectCaching: false
  });

  var gsettlement = new fabric.Polygon([
    {x: 0             , y: 1.2 * size / 3 },
    {x: 0             , y:  .6 * size / 3 },
    {x:  .5 * size / 3, y: 0                  },
    {x: 1   * size / 3, y:  .6 * size / 3 },
    {x: 1   * size / 3, y: 1.2 * size / 3 }
  ], {
    originX: 'center', originY: 'center', opacity: 0, strokeWidth: 2,
    selectable: false, objectCaching: false 
  });

   //_dx = -size / 3; _dy = -2.2 * size / 6;
  var gcity = new fabric.Polygon([
    {x: 0             , y: 1.2 * size / 3 },
    {x: 1   * size / 3, y: 1.2 * size / 3 },
    {x: 1   * size / 3, y:  .6 * size / 3 },
    {x: 1.5 * size / 3, y: 0                  },
    {x: 2   * size / 3, y:  .6 * size / 3 },
    {x: 2   * size / 3, y: 2.2 * size / 3 },
    {x: 0             , y: 2.2 * size / 3 },
  ], {
    originX: 'center', originY: 'center', opacity: 0, strokeWidth: 2,
    selectable: false, objectCaching: false 
  });

  var group = new fabric.Group([ nodeCircle, gsettlement, gcity ], {
    left: dx, top: dy,
    selectable: false, objectCaching: false,
  });
  if (node.harbor.type != "no") {
    var harbor = new fabric.Circle({
      radius: lsize / 3, fill: 'rgba(0,0,0,0.0)', stroke: "#666666", strokeWidth: 1,
      originX: 'center', originY: 'center', opacity: .8,
      selectable: false, objectCaching: false, evented: false
    });

    if (node.harbor.type == "*") loadPattern('assets/harbors/Harbor.png', harbor, lsize / 3);
    else loadPattern('assets/harbors/' + node.harbor.type + '.png', harbor, lsize / 3);
  
    group.add(harbor);
  }
  group.set('_type', "node");
  group.set('_data', node);

  canvas.add(group);

  if (false) {
    var text = new fabric.Text(""+node.i+","+node.j, { fontSize: 18, stroke: 'purple', textBackgroundColor: 'white', left: dx, top: dy, selectable: false, objectCaching: false, evented: false});
    canvas.add(text);
  }
}
function drawRoad (size, x1, y1, x2, y2, road) {
  var lsize = size / 4;
  var dx1 = x1 + size ;
  var dy1 = y1 + size - lsize / 2 ;
  if (nodeIsAtRight(road.nodes[0].i, road.nodes[0].j))
    dx1 = dx1 + lsize;
    else
    dx1 = dx1 - lsize;
  var dx2 = x2 + size ;
  var dy2 = y2 + size - lsize / 2 ;
  if (nodeIsAtRight(road.nodes[1].i, road.nodes[1].j))
    dx2 = dx2 + lsize;
  else
    dx2 = dx2 - lsize;

  var line = new fabric.Line([ dx1, dy1, dx2, dy2 ], {
      stroke: 'rgba(250,250,250,0)', strokeWidth: 12,
      selectable: false, objectCaching: false,
      originX: 'center', originY: 'center',
    });
  line.set('_type', "road");
  line.set('_data', road);

  canvas.add(line);
}

// Update word
function updateTile(tile) {
  var grobber = getFabricObject("robber", tile);
  if (grobber != null){
    if (tile.x == catan.world.robber.x && tile.y == catan.world.robber.y)
      grobber.set("opacity", 1);
    else
      grobber.set("opacity", 0);
  }
}
function updateNode(node) {
  var gnode = getFabricObject("node", node);
  if (gnode != null) {
    gnode.set('_data', node);
    if (node.build.type > 0) {
      gnode.item(1).set('fill', getUsernameColor(node.build.player.username)); 
      gnode.item(1).set('opacity', 1);
      gnode.item(1).set({ strokeWidth: 1, stroke: 'black' });
    }
    if (node.build.type == 2) {
      gnode.item(1).set('opacity', 0);
      gnode.item(2).set('fill', getUsernameColor(node.build.player.username)); 
      gnode.item(2).set('opacity', 1);
      gnode.item(2).set({ strokeWidth: 1, stroke: 'black' });
    }
  }
}
function updateRoad(road) {
  var groad = getFabricObject("road", road);
  if (groad != null) {
    groad.set('_data', road);
    if (road.player.index != -1) {
      groad.set('stroke', getUsernameColor(road.player.username));
      groad.set('opacity', 1);
      groad.set('strokeWidth', 8);
    }
  }
}

// UI utils

function updateResourcesPanel() {
  var cards = playerDeck.resources;
  var sum = 0;
  for (var rsc in cards) {
    sum = sum + cards[rsc];
    if (sum > playerDeck.resourceLimit) $('.resources').css('color', 'red'); else $('.resources').css('color', 'black');
    $('.'+rsc+"Text").text(cards[rsc]);
    $('.'+rsc+"Image").css('opacity', cards[rsc] > 0 ? 1 : .7);
    //$("#playerPanel").find('.'+rsc+"Image").css({ opacity: 1 });
    // Thief modal buttons
    $thiefResourcesModal.find("button[data-rsc='"+rsc+"']").attr("disabled", cards[rsc] == 0);
    // Trade modal buttons
    $tradeModal.find("button[data-rsc='"+rsc+"']").text("x" + playerDeck.resourceTradeCoef[rsc]);
    $tradeModal.find("button[data-rsc='"+rsc+"']").attr("disabled", cards[rsc] < playerDeck.resourceTradeCoef[rsc]);
  }
}
function updateResourcesToReturnPanel(cards) {
  for (var rsc in cards)
    $('.'+rsc+"ReturnedText").text(cards[rsc]);
}
function updateDevsCardsButtons(cards) {
  for (var devCard in playerDeck.devCards.toPlay) {
    $card = $('.play_'+devCard);
    $card.text($card.attr('placeholder') + " (" + cards[devCard] + ")");
    $card.prop('disabled', cards[devCard] == 0 || playerDeck.devCards.playedThisTurnCount >= catan.rules.maxDevCardByTurn);
  }
}
function showThiefPanel() {
  $sendResourcesToBank.attr("disabled", true);
  var sum = 0;
  updateResourcesPanel();
  updateResourcesToReturnPanel(playerDeck.resourcesToReturn);
  $(".remainingText").text(playerDeck.resourceCount);
  $(".returnedText").text(sum);
  var target = Math.floor(playerDeck.resourceCount / 2);
  $returnCard.click(function (event) {
    var type = $(event.target).attr('placeholder');
    if (playerDeck.resources[type] > 0 && sum < target) {
      playerDeck.resources[type]--;
      playerDeck.resourceCount--;
      playerDeck.resourcesToReturn[type]++;
      sum++;
      updateResourcesPanel();
      updateResourcesToReturnPanel(playerDeck.resourcesToReturn);
      $(".remainingText").text(playerDeck.resourceCount);
      $(".returnedText").text(sum);
      if (sum == target) {
        $sendResourcesToBank.attr("disabled", false);
        $returnCard.attr("disabled", true);
      }
    }
    if (playerDeck.resources[type] == 0)
      $(event.target).attr('disabled', true);
  });
  $thiefResourcesModal.css('display', 'block');
}
function showTradePanel() {
  updateResourcesPanel();
  $(".remainingText").text(playerDeck.resourceCount);

  $tradeCard.click(function (event) {
    var type = $(event.target).attr('placeholder');
    var value = playerDeck.resourceTradeCoef[type];
    var rscGetted = $("#tradeImage").attr("data-rsc");
    if (playerDeck.resources[type] >= value) {
      playerDeck.resources[type] = playerDeck.resources[type] - value;
      playerDeck.resourceCount = playerDeck.resourceCount - value;
      playerDeck.trades.push({ toAdd: rscGetted, toRemove: type, count: value});
      updateResourcesPanel();
      $(".remainingText").text(playerDeck.resourceCount);
    }
    if (playerDeck.resources[type] == 0)
      $(event.target).attr('disabled', true);
  });
  
  $tradeModal.css('display', 'block');
}

function openYearOfPlenty() {
  updateYearOfPlenty();
  $yearOfPlentyModal.css('display', 'block');
  playerDeck.yearOfPlentyChoosenCards = [];

  $chooseCardForYearOfPlenty.click(function (event) {
    var type = $(event.target).attr('placeholder');
    playerDeck.yearOfPlentyChoosenCards.push(type);
    if (playerDeck.yearOfPlentyChoosenCards.length > 2) playerDeck.yearOfPlentyChoosenCards.shift();
    updateYearOfPlenty();
  });
}
function updateYearOfPlenty() {
  for (var rsc in playerDeck.resources) {
    var value = 0;
    if (playerDeck.yearOfPlentyChoosenCards[0] == rsc) value++;
    if (playerDeck.yearOfPlentyChoosenCards[1] == rsc) value++;
    $yearOfPlentyModal.find("button[data-rsc='"+rsc+"']").text("+ " + value).css('color', value == 0 ? "white" : "green");
  }
}

function openMonopoly() {
  playerDeck.monopoly = "";
  updateMonopoly();
  $chooseResourceForMonopoly.click(function (event) {
    var type = $(event.target).attr('placeholder');
    playerDeck.monopoly = type;
    updateMonopoly();
  });

  $monopolyModal.css('display', 'block');
}
function updateMonopoly() {
  $confirmChoosenResourceOfMonopoly.attr("disabled", playerDeck.monopoly == "")
  for (var rsc in playerDeck.resources)
    if (playerDeck.monopoly == rsc) 
      $monopolyModal.find("button[data-rsc='"+rsc+"']").text("Selected").css('color', "green");
    else 
      $monopolyModal.find("button[data-rsc='"+rsc+"']").text("Choose").css('color', "white");
}

function showMessage(msg, duration) {
  var text = new fabric.Text(msg, {
    fontSize: 20, fontFamily: 'Comic Sans', textBackgroundColor: "white"
  });
  var group = new fabric.Group([ text ], {
    left: 5, top: 150,
    selectable: false, objectCaching: false, evented: false
  });
  canvas.add(group);
  setTimeout(function(){ canvas.remove(group) }, duration);

}
function getFabricObject(type, data) {
  var objs = canvas.getObjects();
  for (var i=1; i<objs.length; i++) {
    var obj = objs[i];
    if (obj.hasOwnProperty('_type') && obj._type == type) {
      switch (type) {
        case "robber":
          if(obj._data.x == data.x && obj._data.y == data.y)
            return obj;
          break;
        case "node" : 
          if(obj._data.i == data.i && obj._data.j == data.j)
            return obj;
          break;
        case "road" : 
          if (obj._data.nodes[0].i == data.nodes[0].i && obj._data.nodes[0].j == data.nodes[0].j
           && obj._data.nodes[1].i == data.nodes[1].i && obj._data.nodes[1].j == data.nodes[1].j)
            return obj;
          break;
      }
    }
  }
  return null;
}

function createPlayersPanels(players) {
  console.log(JSON.stringify(players));
  $playerPanel.empty();
  for (var p=0; p<players.length; p++) {
    
    var $usernameDiv = $('<span class="username"/>')
      .text(players[p].username)
      .css('color', getUsernameColor(players[p].username)); 
    var $hr = $('<hr>');
    var $infosDiv = $('<div class="_infos"> <div class="_knight">Knight: &nbsp;<span>0</span></div> <div class="_victoryPoint">Victory Point: &nbsp;<span>0</span></div> <div class="_longestRoad">Longest Road: &nbsp;<span>0</span></div>  </div>');
    var $scoreDiv = $('<div class="_score tooltip" title="Score of the player"><span>0</span></div>');
    var $scoreAndInfos = $('<div class="scoreAndInfos"></div ')
      .append($scoreDiv, $infosDiv);
    var $more = $('<div class="playerPanelStatus"></div>');
    var $onePlayerPanel = $('<div class="onePlayer"/>')
      .addClass('_p_' + players[p].username)
      .append($usernameDiv, $hr, $scoreAndInfos, $more);
        
    $playerPanel.append($onePlayerPanel);
  }
}
function updatePlayersPanels(players, currentAction, currentTurn) {
  if (players) {
    console.log(JSON.stringify(players));
    for (var p=0; p<players.length; p++) {
      var $current = $playerPanel.find('._p_' + players[p].username);
      $current.find('._score > span').text(players[p].score);
      $current.find('._knight > span').text(players[p].knight);
      $current.find('._victoryPoint > span').text(players[p].victoryPoint);
      $current.find('._longestRoad > span').text(players[p].longestRoad);
      var $status = $current.find('.playerPanelStatus');
      $status.removeClass('myPlayerPanelStatus').removeClass('disconnectedPlayer').empty();
      if (players[p].username in disconnectedPlayers) {
        //$status.addClass('disconnectedPlayer').text("DISCONNECTED");
      }
      else if (players[p].username==currentAction.to.username) {
        $status.text(getStringAction(currentAction.todo, currentTurn));
        if (currentAction.to.username == username)
          $status.addClass('myPlayerPanelStatus');
      }
     
    }
  }
}

function getStringAction(action, turn) {
  switch (action) {
    case 'ROAD': return "Place a road";
    case 'SETTLEMENT': return "Place a settlement";
    case 'CITY': return "Place a city";
    case 'MOVE_ROBBER': return "Move the robber";
    case 'ROLL_DICE': return "Roll the dice";
    default: 
      switch (turn.phase) {
        case "TRADING": return "Trading...";
        case "BUILDING": return "Building...";
        default: "";
      }
  }
}

// Game utils

function nodeIsAtRight(i, j) {
  if (i == -3 || i == 1 || i == 5) {
    return j % 2 == 0;
  }
  else {
    return j % 2 != 0;
  }
}

function isMyTurn() {
  return gameAction && gameAction.to.username == username;
}
});