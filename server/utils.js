var Utils = function () {

   /** Can place settlement in normal turn?
   * world: World
   * player: Player
   * node: Node
   * return: Boolean
   * */
    this.canPlaceSettlementInNormalTurn = function (world, player, node) {
        // check if not other build or other owner or knight
        if (node.build.type != 0 || node.build.player.index != -1 || node.knight.force != 0)
            return false;
        // check neighbours
        return this.allNeighboursAreFree(world, node) && this.isOnRoad(world, player, node);
    };

    this.getCosts = function (_costs, _type) {
        var costs = [];
        for (var key in _costs[_type]) {
            var value = _costs[_type][key];
            costs.push(value + " " + key + (key != "bricks" && value > 1 ? "s" : ""));
        }
        return costs.join(" + ");
    };

    /** Has 2 tiles in common? */
    this.hasTwoTilesInCommon = function (node1, node2) {
        var inCommom = 0;
        for (var n1 = 0; n1 < node1.tiles.length; n1++) {
            for (var n2 = 0; n2 < node2.tiles.length; n2++) {
                if (node1.tiles[n1].x == node2.tiles[n2].x && node1.tiles[n1].y == node2.tiles[n2].y) {
                    inCommom++;
                    break;
                }
            }
        }
        return inCommom == 2;
    }

    /** Get all neighboring nodes */
    this.getNodeNeighbours = function (_world, _node) {
        var neighbours = [];
        for (var n = 0; n < _world.nodes.length; n++) {
            var node = _world.nodes[n];
            if (this.hasTwoTilesInCommon(_node, node)) {
                //this.log("---> Found " + node.i + "," + node.j);// LOG
                neighbours.push(node);
                if (neighbours.length == 3) break;
            }
        }
        return neighbours;
    };

    /** All neighbours are free? */
    this.allNeighboursAreFree = function (world, node) {
        var neighbours = this.getNodeNeighbours(world, node);
        for (var n = 0; n < neighbours.length; n++)
            if (neighbours[n].build.type != 0) return false;
        return true;
    };

    /**  */
    this.isOnRoad = function (world, player, node) {
        for (var r = 0; r < world.roads.length; r++) {
            var road = world.roads[r];
            if (road.player.index == player.index)
                if ((road.nodes[0].i == node.i && road.nodes[0].j == node.j) || (road.nodes[1].i == node.i && road.nodes[1].j == node.j))
                    return true;
        }
        return false;
    }

    /** Is adjacent road? */
    this.isAdjacentRoad = function (otherRoad, road) {
        if (otherRoad.id == road.id) return false;
        for (var n1 = 0; n1 < 2; n1++) {
            for (var n2 = 0; n2 < 2; n2++) {
                var node1 = otherRoad.nodes[n1], node2 = road.nodes[n2];
                if (node1.i == node2.i && node1.j == node2.j) return true;
            }
        }
        return false;
    };

    this.log = function (text, param) {
        if (true) {
            if (param) console.log(text, param); else console.log(text);
        }
    }
};
module.exports = Utils;