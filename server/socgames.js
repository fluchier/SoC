let Standard3or4 = require('./games/standard3or4');
var SocGames = function () {

    this.games = [
        {
            id: 1,
            name: "Standard",
            game: new Standard3or4(),
        }
    ];

    this.getRules = function (id) {
        for (var t = 0; t < this.games.length; t++) {
            var item = this.games[t];
            if (item.id == id)
                return item.game.rules;
        }
        return null;
    }

    this.getWorld = function (id) {
        for (var t = 0; t < this.games.length; t++) {
            var item = this.games[t];
            if (item.id == id)
                return item.game.world;
        }
        return null;
    }
    this.log = function (text, param) {
        if (true) {
            if (param) console.log(text, param); else console.log(text);
        }
    }
};
module.exports = SocGames;