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
        var item = this.games.find(function (ele) { return ele.id === id;});
        return item.game.rules;
    }
    this.getWorld = function (id) {
        var item = this.games.find(function (ele) { return ele.id === id; });
        return item.game.world;
    }
    this.log = function (text, param) {
        if (true) {
            if (param) console.log(text, param); else console.log(text);
        }
    }
};
module.exports = SocGames;