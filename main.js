
$(function () {

  const FADE_TIME = 150; // ms
  const TYPING_TIMER_LENGTH = 400; // ms
  const COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];
  const rscsClass = [ "lumber", "bricks", "wool", "grain", "ore"];

  // Initialize variables
  let $window = $(window);
  let $usernameInput = $('.usernameInput'); // Input for username
  let $messages = $('.messages'); // Messages area
  let $gameMessages = $('.gameMessages'); // Game messages area
  let $logs = $('.logs'); // Logs area
  let $inputMessage = $('.inputMessage'); // Input message input box

  let $loginPage = $('.login.page'); // The login page
  let $chatPage = $('.game.page'); // The chatroom page
  let $createGame = $('.createGame'); 
  let $leaveGame = $('.leaveGame');
  let $rooms = $('.rooms');

  // DEV
  let $allowOnePlayer = $('#allowOnePlayer');
  let $autoRollDice = $('#autoRollDice');

  let canvas = new fabric.Canvas('canvas_world'),
    f = fabric.Image.filters;

  // Prompt for setting a username
  let username;
  let connected = false;
  let typing = false;
  let mygame = null;
  let lastTypingTime;
  let $currentInput = $usernameInput.focus();

  // Game
  let catan = {
    build: true,
    gameStartTime: 0,
    turnStartTime: 0,
    world: {
      robber: { x: 100, y: 0},
      tiles: [
        { x:  0, y:  0, type: "PASTURE",   value: 0 },
        
        { x:  0, y:  2, type: "FIELDS",    value: 0 },
        { x:  2, y:  1, type: "PASTURE",   value: 0 },
        { x:  2, y: -1, type: "HILLS",     value: 0 },
        { x:  0, y: -2, type: "FOREST",    value: 0 },
        { x: -2, y: -1, type: "MOUNTAINS", value: 0 },
        { x: -2, y:  1, type: "PASTURE",   value: 0 },
        
        { x:  0, y:  4, type: "HILLS",     value: 0 },
        { x:  2, y:  3, type: "FIELDS",    value: 0 },
        { x:  4, y:  2, type: "MOUNTAINS", value: 0 },
        { x:  4, y:  0, type: "FIELDS",    value: 0 },
        { x:  4, y: -2, type: "FOREST",    value: 0 },
        { x:  2, y: -3, type: "PASTURE",   value: 0 },
        { x:  0, y: -4, type: "FOREST",    value: 0 },
        { x: -2, y: -3, type: "FIELDS",    value: 0 },
        { x: -4, y: -2, type: "MOUNTAINS", value: 0 },
        { x: -4, y:  0, type: "FOREST",    value: 0 },
        { x: -4, y:  2, type: "DESERT",    value: 0 },
        { x: -2, y:  3, type: "HILLS",     value: 0 }, 
  
        { x:  0, y:  6, type: "SEA",       value:  0, harbor: "no" },
        { x:  2, y:  5, type: "SEA",       value:  0, harbor: "no" },
        { x:  4, y:  4, type: "SEA",       value:  0, harbor: "no" },
        { x:  6, y:  3, type: "SEA",       value:  0, harbor: "no" },
        { x:  6, y:  1, type: "SEA",       value:  0, harbor: "no" },
        { x:  6, y: -1, type: "SEA",       value:  0, harbor: "no" },
        { x:  6, y: -3, type: "SEA",       value:  0, harbor: "no" },
        { x:  4, y: -4, type: "SEA",       value:  0, harbor: "no" },
        { x:  2, y: -5, type: "SEA",       value:  0, harbor: "no" },
        { x:  0, y: -6, type: "SEA",       value:  0, harbor: "no" },
        { x: -2, y: -5, type: "SEA",       value:  0, harbor: "no" },
        { x: -4, y: -4, type: "SEA",       value:  0, harbor: "no" },
        { x: -6, y: -3, type: "SEA",       value:  0, harbor: "no" },
        { x: -6, y: -1, type: "SEA",       value:  0, harbor: "no" },
        { x: -6, y:  1, type: "SEA",       value:  0, harbor: "no" },
        { x: -6, y:  3, type: "SEA",       value:  0, harbor: "no" },
        { x: -4, y:  4, type: "SEA",       value:  0, harbor: "no" },
        { x: -2, y:  5, type: "SEA",       value:  0, harbor: "no" },
      ]
    },
  };
  let playerDeck;
  let gameAction;
  let disconnectedPlayers = [];
  let disconnectedPlayerTimer = [];
  let gameIntervalId = null;
  let turnIntervalId = null;

  // game buttons

  // My Panel infos
  let $turnText = $('.turn > span')
  let $myScoreText = $('.myScore > span');
  let $myKnightText = $('.knight > span');
  let $myVictoryPointText = $('.victoryPoint > span');
  let $myLongestRoadText = $('.longestRoad > span');
  // My Panel buttons
  let $rollDice = $('.rollDice');
  let $openTradingCard = $('.openTradingBank');
  let $openTradingPlayers = $('.openTradingPlayers');
  let $endTrading = $('.endTrading');
  let $build = $('.build');
  let $buyDevCard = $('.buyDevCard');
  let $playKnight = $('.play_knight');
  let $playVictoryPoint = $('.play_victoryPoint');
  let $playRoadBuilding = $('.play_roadBuilding');
  let $playMonopoly = $('.play_monopoly');
  let $playYearOfPlenty = $('.play_yearOfPlenty');
  let $endTurn = $('.endTurn')
  
  // All players Panel
  let $playerPanel = $('#allPlayers');

  // modals
  let $thiefResourcesModal = $('#thiefResourcesModal');
  let $returnCard = $('.returnCard');
  let $cancelReturnCard = $('.cancelReturnCard');
  let $sendResourcesToBank = $('.sendResources');

  let $tradeModal = $('#tradeModal');
  let $tradeCard = $('.tradeCard');
  let $confirmTradeToBank = $('.confirmTradeToBank');
  let $cancelTradeToBank = $('.cancelTradeToBank');

  let $yearOfPlentyModal = $('#yearOfPlentyModal');
  let $chooseCardForYearOfPlenty = $('.chooseCardForYearOfPlenty');
  let $confirmChoosenCardForYearOfPlenty = $('.confirmChoosenCardForYearOfPlenty');

  let $monopolyModal = $('#monopolyModal');
  let $chooseResourceForMonopoly = $('.chooseResourceForMonopoly');
  let $confirmChoosenResourceOfMonopoly = $('.confirmChoosenResourceOfMonopoly');

  let $tradePlayersModal = $('#tradePlayersModal');
  let $givesCard = $('.givesCard');
  let $demandsCard = $('.demandsCard');
  let $proposeExchange = $('.proposeExchange');
  let $cancelTradeWithPlayers = $('.cancelTradeWithPlayers');

  // COM
  let socket = io();

  if (localStorage.getItem('Free-SoC-autologin')) {
    $usernameInput.val(localStorage.getItem('Free-SoC-autologin'));
    //socket.emit('add user', localStorage.getItem('Free-SoC-autologin')); 
  }

  // Sounds
  createjs.Sound.alternateExtensions = ["mp3"];
  createjs.Sound.registerSound({ src:"./assets/sounds/house-building.mp3",  id: "house-building"});
  createjs.Sound.registerSound({ src: "./assets/sounds/rolling-dice-2.wav", id: "dice-rolling" });
  createjs.Sound.registerSound({ src: "./assets/sounds/nope.ogg", id: "nope" });
  createjs.Sound.registerSound({ src: "./assets/sounds/go.wav", id: "go" });
  createjs.Sound.registerSound({ src: "./assets/sounds/now-its-your-turn.wav", id: "your-turn" });
  createjs.Sound.registerSound({ src: "./assets/sounds/move-the-robber.mp3", id: "move-the-robber" });
  createjs.Sound.registerSound({ src: "./assets/sounds/messagesent01.wav", id: "messagesent" });

  function addParticipantsMessage (data) {
    let message = '';
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
      let size = 50, dx = 360, dy = 5 * size + 17;
      for (let t=0; t<catan.world.tiles.length; t++) {
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
    let message = $inputMessage.val();
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
        if (mygame != null && mygame.launch)
            socket.emit('gameMessage', {
                username: username,
                message: message,
                room: mygame.id
            });
        else {
            socket.emit('new message', message);
            createjs.Sound.play("messagesent");
        }

    }
  }
  // Log a message
  function log (message, options) {
    let $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options, $logs);
  }
  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    let $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    let $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));

    let dt = new Date(data.time);
    let $dtDiv = $('<span class="chatdate"/>').text( '@'
      + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
      + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) + ' ');
      
    let $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    let typingClass = data.typing ? 'typing' : '';
    let $messageDiv = $('<li class="message"/>')
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

    let $players = $('<div class="players"> </div>');
    mygame = null;
    for (let i=0; i<data.maxPlayerCount; i++) {
      let $player = $('<span class="player username" />').text("Free place").css('color', 'gray').css('font-style', 'italic');
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

    let $joinOrLaunchGame = $('<button class="joinOrLaunchGame tooltip"/>').attr('title', 'Join this game').text("Join Game").click(function () {joinGame(data)});
    if (!data.canBeJoin || mygame!=null) {
      $joinOrLaunchGame.prop('disabled', true);
    }

    if (mygame!=null && mygame.id==data.id) {
      $joinOrLaunchGame.text("Start Game").attr('title', 'You must be at least ' + data.minPlayerCount + ' players to start the game').prop('disabled', !data.canBeLaunch).click(function () {launchGame(data)});
      if(data.launched) {
        $joinOrLaunchGame.attr('title', 'This game has already started!').text("In progress");
      }
    }
    let $messageDiv = $('<li class="room"/>')
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
    let $el = $(el);
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
    let $usernameDiv = $('<span class="username"/>')
        .text(data.username)
        .css('color', getUsernameColor(data.username));
    let $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);
    let $messageDiv = $('<li class="message"/>')
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
        let typingTimer = (new Date()).getTime();
        let timeDiff = typingTimer - lastTypingTime;
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
    let hash = 7;
    for (let i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    let index = Math.abs(hash % COLORS.length);
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
    $cancelReturnCard.unbind("click");
    $thiefResourcesModal.css('display', 'none');
  });

  $('#tradeImage').click(function(){
    let rsc = rscsClass.shift();
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
  $proposeExchange.click(function(){
    $givesCard.unbind( "click" );
    $demandsCard.unbind( "click" );
    $tradePlayersModal.css('display', 'none');
    sendExchangeOffer();
  });
  $cancelTradeWithPlayers.click(function(){
    $givesCard.unbind( "click" );
    $demandsCard.unbind( "click" );
    $tradePlayersModal.css('display', 'none');
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
  $openTradingPlayers.click(function(){
    showTradeWithPlayersPanel();
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
    let message = "Welcome to the Game Server of Free-SoC 1.0.2 (BETA) - 2019/04/15";
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
      if (data.username == "GAME") {
          if (data.message.indexOf("you can't do it!") != -1) {
              createjs.Sound.play("nope");
          }
          else if (data.message.indexOf("You are in the game room. Let's play !") != -1) {
              createjs.Sound.play("go");
          }
      }
  });


  // Whenever the server emits 'username already exists', alert it
  socket.on('username already exists', function(data) {
    username = null;
    alert("This username '" + data + "' already exists.");
  });
  socket.on('chatHistory', function(messages) {
    for(let m=0; m<messages.length; m++)
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
    let gameOptions = {};
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
    for (let i=0; i<data.totalGameCount; i++){
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
    let start = Date.now();
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
      for(let i = 0; i < data.playerCount; i++){
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
    let elapsed = Math.floor((Date.now() - from) / 1000);
    let text = "";
    let h = Math.floor(elapsed / 3600);
    let m = Math.floor((elapsed % 3600) / 60);
    let s = elapsed - 3600 * h - 60 * m;
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
    let size = 50, dx = 360, dy = 5 * size + 17;
    for (let t=0; t<catan.world.tiles.length; t++) {
      drawTile(
        size, 
        dx + catan.world.tiles[t].x * 0.75 * size, 
        dy + catan.world.tiles[t].y * size * Math.sin(2 * Math.PI / 6),
        catan.world.tiles[t]
      );
    }
    for (let r=0; r<catan.world.roads.length; r++) {
      drawRoad(
        size,
        dx + catan.world.roads[r].nodes[0].i * 0.75 * size,
        dy + catan.world.roads[r].nodes[0].j * size * Math.sin(2 * Math.PI / 6),
        dx + catan.world.roads[r].nodes[1].i * 0.75 * size,
        dy + catan.world.roads[r].nodes[1].j * size * Math.sin(2 * Math.PI / 6),
        catan.world.roads[r]
      );
    }
    for (let n=0; n<catan.world.nodes.length; n++) {
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

    //console.log("====== gameData ======");
    console.log(JSON.stringify(data.currentTrades));

    // Update turn display et Players panel
    $turnText.text(catan.currentTurn.turn);
    updatePlayersPanels(data.playersInfos, gameAction, catan.currentTurn, data.currentTrades);

    // Update model of world
    for (let i=0; i<catan.world.tiles.length; i++) {
      updateTile(catan.world.tiles[i]);
    }
    for (let n=0; n<catan.world.nodes.length; n++) {
      updateNode(catan.world.nodes[n]);
    }
    for (let r=0; r<catan.world.roads.length; r++) {
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
        if (gameAction.todo == "SETTLEMENT" || gameAction.todo == "CITY" || gameAction.todo == "ROLL_DICE") {
            catan.turnStartTime = Date.now();
            createjs.Sound.play("your-turn");
        }
        addChatGameMessage({username: "TURN " + catan.currentTurn.turn , message: username + "! It's up to you to play: " + gameAction.todo + " (" + catan.currentTurn.phase + ")"});
        if (playerDeck) updateDevsCardsButtons(playerDeck.devCards.toPlay);
        switch (catan.currentTurn.phase) {
          case "ROLL_DICE": 
            $rollDice.prop('disabled', false);
            if ($autoRollDice.is(':checked')) rollDice();
          break;
          case "TRADING": 
            $openTradingCard.prop('disabled', false);
            $openTradingPlayers.prop('disabled', false);
            $tradePlayersModal.find('.modal-title').text("Offer an exchange with other players");
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
        
        if (gameAction.todo == "MOVE_ROBBER") {
          $(".gameButtons").find("button").prop('disabled', true);
          showMessage("You have to move the robber.", 3000);
          createjs.Sound.play("move-the-robber"); 
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
        if (catan.currentTurn.phase == 'TRADING') {
          $tradePlayersModal.find('.modal-title').text("Offer an exchange with " + gameAction.to.username);
          $openTradingPlayers.prop('disabled', false);
        }
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
    let diceResult = catan.currentTurn.dice1 + catan.currentTurn.dice2;
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
    let diceResult = catan.currentTurn.dice1 + catan.currentTurn.dice2;
    addChatGameMessage({username: "GAME", message: data.username + " is the winner!"});
    showMessage(data.username + " is the winner!", 50000);
  });
  
  // Send Game Action

  function rollDice() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "ROLL_DICE"
    });
    createjs.Sound.play("dice-rolling");
  }

  /* NORMAL TURN - PHASE 'ROLL_DICE' */

  // When the dice result is 7, sometimes you have to send the half of your resource cards
  function sendResourcesToBank() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "BANK",
      todo: "SEND_RSRC_TO_BANK",
      resourcesToReturn: playerDeck.resourcesToReturn
    });
  }

  /* NORMAL TURN - PHASE 'TRADING' */

  // You trade with the bank
  function sendTradeToBank() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "BANK",
      todo: "TRADE_RSRC_WITH_BANK",
      trades: playerDeck.trades
    });
  }
  // You offer a trade with the others players
  function sendExchangeOffer() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "*",
      todo: "OFFER_EXCHANGE",
      offer: playerDeck.exchange
    });
  }
  // You accept a trade of a other player
  function acceptTrade(trade) {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: trade.from,
      todo: "ACCEPT_EXCHANGE",
      trade: trade
    });
  }
  // You refuse a trade of a other player
  function refuseTrade(trade) {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: trade.from,
      todo: "REFUSE_EXCHANGE",
      trade: trade
    });
  }
  // You confirm a trade accepted by a other player
  function confirmTrade(trade, to) {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: to,
      todo: "CONFIRME_EXCHANGE",
      trade: trade
    });
  }
  // You close the phase 'TRADING' to go the phase 'BUILDING'
  function endTrading() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "END_TRADING"
    });
  }

  /* NORMAL TURN - PHASE 'BUILDING' */

  function buyDevCard() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "BANK",
      todo: "BUY_DEV_CARD"
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

  /* NORMAL TURN - YOU PLAY A DEV CARD */

  // You play a dev card 'KNIGHT' 
  function playKnight() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_KNIGHT"
    });
  }
  // You play a dev card 'YEAR OF PLENTY' 
  function playYearOfPlenty() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_YEAR_OF_PLENTY"
    });
  }
  function sendChoosenCardOfYearOfPlenty() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "*",
      todo: "SEND_CHOOSEN_CARDS_OF_YEAR_OF_PLENTY",
      yearOfPlentyChoosenCards: playerDeck.yearOfPlentyChoosenCards
    });
  }
  // You play a dev card 'MONOPOLY' 
  function playMonopoly() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_MONOPOLY"
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
  // You play a dev card 'ROAD BUILDING' 
  function playRoadBuilding() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_ROAD_BUILDING"
    });
  }
  // You play a dev card 'VICTORY POINT' 
  function playVictoryPoint() {
    play({
      turn: catan.currentTurn.turn,
      from: username,
      to: "GAME",
      todo: "PLAY_VICTORY_POINT"
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
    let delta = opt.e.deltaY;
    let pointer = canvas.getPointer(opt.e);
    let zoom = canvas.getZoom();
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
    let tg = options.target;
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
    // NORMAL TURN
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
            if (gameAction.todo == 'SPECIAL_ROAD_1' || gameAction.todo == 'SPECIAL_ROAD_2'){
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
            else if (catan.build && catan.currentTurn.phase == 'BUILDING') {
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
          if(isMyTurn() && catan.build && catan.currentTurn.phase == 'BUILDING'){
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
    let tg = options.target;
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
    let tg = options.target;
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
  img.scaleToWidth(2*size);
  let patternSourceCanvas = new fabric.StaticCanvas(null, {enableRetinaScaling: false});
    patternSourceCanvas.add(img);
    let pattern = new fabric.Pattern({
      source: function() {
        patternSourceCanvas.setDimensions({
          width: img.getScaledWidth() + 1, height: img.getScaledHeight() + 1
        });
        patternSourceCanvas.renderAll();
        return patternSourceCanvas.getElement();
      },
      repeat: "no-repeat"
    });
    target.set( { 
      fill: pattern
    });
    canvas.renderAll();
  });
}

function drawTile (size, _x, _y, tile) {

  // robber
  let robber = new fabric.Circle({
    radius: size / 4, stroke: 'white', fill: 'black', opacity: 0,
    left: _x + size / 2, top: _y + size / 4,
    selectable: false, objectCaching: false 
  });

  let robber2 = new fabric.Circle({
    radius: size / 4, stroke: 'black', fill: 'purple',
    left: size / 2, top: size / 4
  });
  if (tile.x == catan.world.robber.x && tile.y == catan.world.robber.y) {
    robber.set("opacity", 1);
  }
  // hex 
  let hex = new fabric.Polygon([
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
  let gtile = new fabric.Group([ hex/*, robber2*/], {
    left: _x, top: _y,
    selectable: false, objectCaching: false
  });

  gtile.set('_type', "tile");
  gtile.set('_data', tile);
  canvas.add(gtile);
  robber.set('_type', "robber");
  robber.set('_data', tile);
  canvas.add(robber);

  let lsize = size / 2;
  let dx = _x + size - lsize / 2;
  let dy = _y + size - 3 * lsize / 4;

  if (tile.type == 'SEA' && tile.harbor != "no") {
    let seaHarbor = new fabric.Circle({
      radius: lsize / 2, stroke: 'black', fill: 'white', opacity: .8,
      originX: 'center', originY: 'center'
    });
    if (tile.harbor == "*") loadPattern('assets/harbors/Harbor.png', seaHarbor, lsize / 2);
    else loadPattern('assets/harbors/' + tile.harbor + '.png', seaHarbor, lsize / 2);
    gtile.add(seaHarbor);
  }

  if (tile.type != 'DESERT' && tile.type != 'SEA' && tile.value != 0) { // add token
    let circle = new fabric.Circle({
      radius: lsize / 2, stroke: 'black', fill: 'white', 
      originX: 'center', originY: 'center', opacity: .6,
    });
    let text = new fabric.Text(""+tile.value, {
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
    let token = new fabric.Group([ circle, text ], {
      left: dx, top: dy,
      selectable: false, objectCaching: false, evented: false
    });
    token.set('_type', "token");
    token.set('_data', tile.value);

    canvas.add(token);
  }
}
function drawNode (size, _x, _y, node) {
  let lsize = size / 2;
  let dx = _x + size - 3 * lsize / 4;
  let dy = _y + size - 5 * lsize / 4;
  if (nodeIsAtRight(node.i, node.j))
    dx = dx + lsize / 2;
  else
    dx = dx - lsize / 2;
  let nodeCircle = new fabric.Circle({
    radius: lsize / 2.5, fill: 'rgba(0,0,0,0)', stroke: 'black', strokeWidth: 0,
    originX: 'center', originY: 'center',
    selectable: false, objectCaching: false
  });

  let gsettlement = new fabric.Polygon([
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
  let gcity = new fabric.Polygon([
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

  let group = new fabric.Group([ nodeCircle, gsettlement, gcity ], {
    left: dx, top: dy,
    selectable: false, objectCaching: false,
  });
  if (node.harbor.type != "no") {
    let harbor = new fabric.Circle({
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
    let text = new fabric.Text(""+node.i+","+node.j, { fontSize: 18, stroke: 'purple', textBackgroundColor: 'white', left: dx, top: dy, selectable: false, objectCaching: false, evented: false});
    canvas.add(text);
  }
}
function drawRoad (size, x1, y1, x2, y2, road) {
  let lsize = size / 4;
  let dx1 = x1 + size ;
  let dy1 = y1 + size - lsize / 2 ;
  if (nodeIsAtRight(road.nodes[0].i, road.nodes[0].j))
    dx1 = dx1 + lsize;
    else
    dx1 = dx1 - lsize;
  let dx2 = x2 + size ;
  let dy2 = y2 + size - lsize / 2 ;
  if (nodeIsAtRight(road.nodes[1].i, road.nodes[1].j))
    dx2 = dx2 + lsize;
  else
    dx2 = dx2 - lsize;

/* 
   let path = "M" + dx1 + " " + dy1 + "L" + dx2 + " " + dy2;

    var pathline = new fabric.Path(path, {
        stroke: 'red', strokeWidth: 3,
        selectable: false, objectCaching: false,
        originX: 'center', originY: 'center',
    });
    pathline.set('_type', "road");
    pathline.set('_data', road);
    canvas.add(pathline);
*/



    let line = new fabric.Line([dx1, dy1, dx2, dy2], {
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
  let grobber = getFabricObject("robber", tile);
  if (grobber != null){
    if (tile.x == catan.world.robber.x && tile.y == catan.world.robber.y)
      grobber.set("opacity", 1);
    else
      grobber.set("opacity", 0);
  }
}
function updateNode(node) {
  let gnode = getFabricObject("node", node);
  if (gnode != null) {
    gnode.set('_data', node);
    if (node.build.type == 0) {
        if (test() && playerDeck && playerDeck.opts && playerDeck.opts.showPossibleBuilds) {
            if (isMyTurn() && catan.build) {
                if (gameAction.todo == "SETTLEMENT") {
                    gnode.item(1).set('fill', "green");
                    gnode.item(1).set('opacity', .8);
                    gnode.item(1).set('strokeWidth', 1);
                }
                else if (gameAction.todo == "CITY") {
                    gnode.item(2).set('fill', "green");
                    gnode.item(2).set('opacity', .8);
                    gnode.item(2).set('strokeWidth', 1);
                }
            }
        }
    }
    else {
        gnode.item(1).set('fill', getUsernameColor(node.build.player.username)); 
        gnode.item(1).set('opacity', 1);
        gnode.item(1).set({ strokeWidth: 1, stroke: 'black' });
        //createjs.Sound.play("house-building");
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
  let groad = getFabricObject("road", road);
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
  let sum = 0;
  for (let rsc in playerDeck.resources) {
    sum = sum + playerDeck.resources[rsc];
    if (sum > playerDeck.resourceLimit) $('.resources').css('color', 'red'); else $('.resources').css('color', 'black');
    $('.'+rsc+"Text")
      .text(playerDeck.resources[rsc])
      .css('color', playerDeck.resources[rsc] == 0 ? 'grey' : 'black');
    $('.'+rsc+"Image").css('opacity', playerDeck.resources[rsc] > 0 ? 1 : .7);
    //$("#playerPanel").find('.'+rsc+"Image").css({ opacity: 1 });
    // Thief modal buttons
    $('.'+rsc+"ReturnedImage")
      .css('opacity', playerDeck.resourcesToReturn[rsc] > 0 ? 1 : .7);
    $thiefResourcesModal.find("button[data-rsc='"+rsc+"']").filter(".returnCard").attr("disabled", playerDeck.resources[rsc] == 0);
    $thiefResourcesModal.find("button[data-rsc='"+rsc+"']").filter(".cancelReturnCard").attr("disabled", playerDeck.resourcesToReturn[rsc] == 0);
    // Trade with bank modal: texts and buttons
    $tradeModal.find("button[data-rsc='"+rsc+"']").text("x" + playerDeck.resourceTradeCoef[rsc]);
    $tradeModal.find("button[data-rsc='"+rsc+"']").attr("disabled", playerDeck.resources[rsc] < playerDeck.resourceTradeCoef[rsc]);
    // Trade with other players modal: texts and buttons
    $tradePlayersModal.find("button[data-rsc='"+rsc+"']").filter(".givesCard").attr("disabled", playerDeck.resources[rsc] == 0);
  }
}
function updateResourcesToReturnPanel(cards) {
  for (let rsc in cards)
    $('.'+rsc+"ReturnedText").text(cards[rsc]);
}
function updateDevsCardsButtons(cards) {
  for (let devCard in playerDeck.devCards.toPlay) {
    $card = $('.play_'+devCard);
    $card.text($card.attr('placeholder') + " (" + cards[devCard] + ")");
    $card.prop('disabled', cards[devCard] == 0 || playerDeck.devCards.playedThisTurnCount >= catan.rules.maxDevCardByTurn);
  }
}
function showThiefPanel() {
  $sendResourcesToBank.attr("disabled", true);
  let sum = 0;
  updateResourcesPanel();
  updateResourcesToReturnPanel(playerDeck.resourcesToReturn);
  $(".remainingText").text(playerDeck.resourceCount);
  $(".returnedText").text(sum);
  let target = Math.floor(playerDeck.resourceCount / 2);
  $returnCard.click(function (event) {
    let type = $(event.target).attr('placeholder');
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
  $cancelReturnCard.click(function (event) {
    let type = $(event.target).attr('placeholder');
    if (playerDeck.resourcesToReturn[type] > 0) {
      playerDeck.resourcesToReturn[type]--;
      playerDeck.resources[type]++;
      playerDeck.resourceCount++;
      sum--;
      updateResourcesPanel();
      updateResourcesToReturnPanel(playerDeck.resourcesToReturn);
      $(".remainingText").text(playerDeck.resourceCount);
      $(".returnedText").text(sum);
      if (sum < target) {
        $sendResourcesToBank.attr("disabled", true);
        $returnCard.attr("disabled", false);
      }
    }
  });
  $thiefResourcesModal.css('display', 'block');
}
function showTradePanel() {
  updateResourcesPanel();
  $(".remainingText").text(playerDeck.resourceCount);

  $tradeCard.click(function (event) {
    let type = $(event.target).attr('placeholder');
    let value = playerDeck.resourceTradeCoef[type];
    let rscGetted = $("#tradeImage").attr("data-rsc");
    if (playerDeck.resources[type] >= value) {
      playerDeck.resources[type] = playerDeck.resources[type] - value;
      playerDeck.resourceCount = playerDeck.resourceCount - value;
      playerDeck.trades.push({ toAdd: rscGetted, toRemove: type, count: value});
      updateResourcesPanel();
      $(".remainingText").text(playerDeck.resourceCount);
    }
    //if (playerDeck.resources[type] == 0) $(event.target).attr('disabled', true);
  });
  
  $tradeModal.css('display', 'block');
}
function showTradeWithPlayersPanel() {
  updateResourcesPanel();
  playerDeck.exchange = {
    given: { bricks: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
    demanded: { bricks: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
    proposedBy: username,
    acceptedBy: {},
    refusedBy: {}
  };
  updateTradePlayersPanel();

  $givesCard.click(function (event) {
    let type = $(event.target).attr('placeholder');
    if (playerDeck.resources[type] > 0) {
      playerDeck.resources[type]--;
      playerDeck.resourceCount--;
      playerDeck.exchange.given[type]++;
      updateResourcesPanel();
      updateTradePlayersPanel();
    }
  });

  $demandsCard.click(function (event) {
    let type = $(event.target).attr('placeholder');
    playerDeck.exchange.demanded[type]++;
    updateResourcesPanel();
    updateTradePlayersPanel();
  });
  $tradePlayersModal.css('display', 'block');
}

function updateTradePlayersPanel() {
  let totalGiven = 0;
  for (let rsc in playerDeck.exchange.given) {
    let given = playerDeck.exchange.given[rsc];
    totalGiven += given;
    $tradePlayersModal.find('.'+rsc+"GivenText")
      .text(given).css('color', given == 0 ? 'grey' : 'black');
  }
  $tradePlayersModal.find('.totalGivenText')
    .text(totalGiven).css('color', totalGiven == 0 ? 'grey' : 'black');
  let totalDemanded = 0;
  for (let rsc in playerDeck.exchange.demanded) {
    let demanded = playerDeck.exchange.demanded[rsc];
    totalDemanded += demanded;
    $tradePlayersModal.find('.'+rsc+"RequestedText")
      .text(demanded).css('color', demanded == 0 ? 'grey' : 'black');
    $tradePlayersModal.find('.'+rsc+"RequestedImage")
      .css('opacity', demanded > 0 ? 1 : .7);
  }
  $tradePlayersModal.find('.totalRequestedText')
    .text(totalDemanded).css('color', totalDemanded == 0 ? 'grey' : 'black');
}

function openYearOfPlenty() {
  updateYearOfPlenty();
  $yearOfPlentyModal.css('display', 'block');
  playerDeck.yearOfPlentyChoosenCards = [];

  $chooseCardForYearOfPlenty.click(function (event) {
    let type = $(event.target).attr('placeholder');
    playerDeck.yearOfPlentyChoosenCards.push(type);
    if (playerDeck.yearOfPlentyChoosenCards.length > 2) playerDeck.yearOfPlentyChoosenCards.shift();
    updateYearOfPlenty();
  });
}
function updateYearOfPlenty() {
  for (let rsc in playerDeck.resources) {
    let value = 0;
    if (playerDeck.yearOfPlentyChoosenCards[0] == rsc) value++;
    if (playerDeck.yearOfPlentyChoosenCards[1] == rsc) value++;
    $yearOfPlentyModal.find("button[data-rsc='"+rsc+"']").text("+ " + value).css('color', value == 0 ? "white" : "green");
  }
}

function openMonopoly() {
  playerDeck.monopoly = "";
  updateMonopoly();
  $chooseResourceForMonopoly.click(function (event) {
    let type = $(event.target).attr('placeholder');
    playerDeck.monopoly = type;
    updateMonopoly();
  });

  $monopolyModal.css('display', 'block');
}
function updateMonopoly() {
  $confirmChoosenResourceOfMonopoly.attr("disabled", playerDeck.monopoly == "")
  for (let rsc in playerDeck.resources)
    if (playerDeck.monopoly == rsc) 
      $monopolyModal.find("button[data-rsc='"+rsc+"']").text("Selected").css('color', "green");
    else 
      $monopolyModal.find("button[data-rsc='"+rsc+"']").text("Choose").css('color', "white");
}

function showMessage(msg, duration) {
  let text = new fabric.Text(msg, {
    fontSize: 20, fontFamily: 'Comic Sans', textBackgroundColor: "white"
  });
  let group = new fabric.Group([ text ], {
    left: 5, top: 150,
    selectable: false, objectCaching: false, evented: false
  });
  canvas.add(group);
  setTimeout(function(){ canvas.remove(group) }, duration);

}
function getFabricObject(type, data) {
  let objs = canvas.getObjects();
  for (let i=1; i<objs.length; i++) {
    let obj = objs[i];
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
  for (let p=0; p<players.length; p++) {
    
    let $usernameDiv = $('<span class="username"/>')
      .text(players[p].username)
      .css('color', getUsernameColor(players[p].username)); 
    let $hr = $('<hr>');
    let $infosDiv = $('<div class="_infos"> <div class="_knight">Knight: &nbsp;<span>0</span></div> <div class="_victoryPoint">Victory Point: &nbsp;<span>0</span></div> <div class="_longestRoad">Longest Road: &nbsp;<span>0</span></div>  </div>');
    let $scoreDiv = $('<div class="_score tooltip" title="Score of the player"><span>0</span></div>');
    let $scoreAndInfos = $('<div class="scoreAndInfos"></div ')
      .append($scoreDiv, $infosDiv);
    let $more = $('<div class="playerPanelStatus"></div>');
    let $trades = $('<div class="playerPanelTrades"></div>');
    let $onePlayerPanel = $('<div class="onePlayer"/>')
      .addClass('_p_' + players[p].username)
      .append($usernameDiv, $hr, $scoreAndInfos, $more, $trades);
        
    $playerPanel.append($onePlayerPanel);
  }
}
function updatePlayersPanels(players, currentAction, currentTurn, trades) {
  if (players) {
    console.log(JSON.stringify(players));
    for (let p=0; p<players.length; p++) {
      let $current = $playerPanel.find('._p_' + players[p].username);
      $current.find('._score > span').text(players[p].score);
      $current.find('._knight > span').text(players[p].knight);
      $current.find('._victoryPoint > span').text(players[p].victoryPoint);
      $current.find('._longestRoad > span').text(players[p].longestRoad);
      let $status = $current.find('.playerPanelStatus');
      $status.removeClass('myPlayerPanelStatus').removeClass('disconnectedPlayer').empty();
      if (players[p].username in disconnectedPlayers) {
        $status.addClass('disconnectedPlayer').text("DISCONNECTED");
      }
      else if (players[p].username==currentAction.to.username) {
        $status.text(getStringAction(currentAction.todo, currentTurn));
        if (currentAction.to.username == username)
          $status.addClass('myPlayerPanelStatus');
      }
      // Trades
      $trade = $current.find('.playerPanelTrades');
      $trade.empty();
      if (trades) {
        for (let id in trades) {
          let trade = trades[id];

          // Create $offer..
          let $given = $('<div class="given" title="Given"></div>');
          for(let rsc in trade.offer.given){
            for (let c=0; c<trade.offer.given[rsc]; c++) {
              let $card = $('<div></div>');
              $card.addClass(rsc + "Image" );
              $card.addClass("miniCard");
              $given.append($card);
            }
          }
          let $demanded = $('<div class="demanded" title="Demanded"></div>');
          for(let rsc in trade.offer.demanded){
            for (let c=0; c<trade.offer.demanded[rsc]; c++) {
              let $card = $('<div></div>');
              $card.addClass(rsc + "Image");
              $card.addClass("miniCard");
              $demanded.append($card);
            }
          }

          if (trade.from != username) {// ..done by another player..          
            if (trade.from == players[p].username) {// ...done by the player of this panel...
              // if i accepted this offer create status "waiting" (bouton ? disabled)
              if (trade.offer.acceptedBy[username] != null){
                let $button = $('<button class="tradeButton waiting" disabled></button>')
                .text("?");
                 // Display $offer & $buttons
                 $trade.append($given, $demanded, $buttons);
              }
              // if i didn't refuse this offer: create buttons to accept/refuse
              else if (trade.offer.refusedBy[username] == null) {
                // ...create $buttons to answer
                let $acceptButton = $('<button class="tradeButton accept"></button>')
                    .data("trade", trade)
                    .text("V")
                    .click(function() {
                      acceptTrade($(this).data("trade"));
                    });
                let $refuseButton = $('<button class="tradeButton refuse"></button>')
                    .data("trade", trade)
                    .text("X")
                    .click(function() {
                      refuseTrade($(this).data("trade"));
                    });
                let $buttons = $('<div class="tradeButtons"></div>')
                    .append ($acceptButton, $refuseButton)
                    .click(function() {
                      //alert("unbind")
                      $acceptButton.unbind("click");
                      $refuseButton.unbind("click");
                      $(this).unbind("click");
                    });
                // Display $offer & $buttons
                $trade.append($given, $demanded, $buttons);
              }
            }
          }
          else if (trade.from == username) {// ..done by me! 
            if (players[p].username != username) {// so for the panel of other players
              // ...and status "waiting" (bouton ? disabled)
              let $button = $('<button class="tradeButton waiting" disabled></button>')
                    .text("?");
              // But if the player accepted the trade, active the confim button...
              if (trade.offer.acceptedBy[players[p].username]){
                $button
                    .attr("disabled", false)
                    .data("trade", trade)
                    .data("user", players[p].username)
                    .text("V")
                    .removeClass("waiting").addClass("accept")
                    .click(function() {
                      confirmTrade($(this).data("trade"), $(this).data("user"));
                      $(this).unbind("click");
                    });
              }
              // ...else if the player refused the trade, show the refuse status
              else if (trade.offer.refusedBy[players[p].username]){
                $button
                    .text("X")
                    .removeClass("waiting").addClass("refuse");
              }
              // Display offer & buttons
              $trade.append($given, $demanded, $button);
            }
          }
        }
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