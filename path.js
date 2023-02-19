let PathNode = require('./pathnode');
var Path = function () {

    this.pathNodes = [];    

    this.addRoad = function (road) {

        this.log("Adding road .... ");
        var pathNode = new PathNode(road.nodes)
        if (this.pathNodes.length > 0) {
            this.connect(pathNode);
        }
        else {
            this.pathNodes.push(pathNode);
            return this.pathNodes.length == 1;
        }
        return false;
    };

    this.connect = function (pathNode) {
        // for each node of this path
        for (var t = 0; t < this.pathNodes.length; t++) {
            var node = this.pathNodes[t];
            if (node.id == pathNode.id) continue;
            var connected = false;
            // for each extremity of a node
            for (var n = 0; n < node.extremities.length; n++) {
                var existingPathExt = node.extremities[n];
                if (existingPathExt.connectedTo == -1) {
                    // for each extremity of the new node
                    for (var m = 0; m < pathNode.extremities.length; m++) {
                        var newPathExt = pathNode.extremities[m];
                        if (newPathExt.i == existingPathExt.i && newPathExt.j == existingPathExt.j) {
                            // connect road;
                            node.extremities[n].connectedTo = pathNode.id;
                            pathNode.extremities[m].connectedTo = node.id;
                            // and push new pathMode
                            this.pathNodes.push(pathNode);
                            connected = true;
                            break;
                        }
                    }
                }
                if (connected) break;
            }
        }
    };

    this.getPathNodeByID = function (id) {
        for (var t = 0; t < this.pathNodes.length; t++)
            if (this.pathNodes[t].id = id)
                return this.pathNodes[t];
    }
    this.reset = function () {
        for (var n = 0; n < this.pathNodes.length; n++) {
            this.pathNodes[n].reset();
        }
    };

    this.maxLength = function () {
        this.log("maxLength");
        var len = 0;
        var starts = this.getStarts();
        this.log(JSON.stringify(starts, null, 2));
        for (var t = 0; t < starts.length; t++) {
            this.reset();
            len = Math.max(len, this.getNexts(starts[t], 1));
        }
        return len;
    };

    this.getStarts = function () {
        var starts = [];
        for (var t = 0; t < this.pathNodes.length; t++)
            if (this.pathNodes[t].isStartOrEnd())
                starts.push(this.pathNodes[t]);
        return starts;
    };

    this.getNexts = function (node, l) {

        this.log("getNexts of " + node.id + "(level " + l + ")");

        // Get next nodes not read
        var nextIDs = node.getNexts();
        var noReadNexts = [];
        for (var i = 0; i < nextIDs.length; i++) {
            if (node.id == nextIDs[i]) continue;
            var nextNode = this.getPathNodeByID(nextIDs[i]);
            if (!nextNode.read)
                noReadNexts.push(nextNode);
        }

        //this.log(JSON.stringify(noReadNexts, null, 2));

        //
        if (noReadNexts != null && noReadNexts.length > 0)
            for (var n = 0; n < noReadNexts.length; n++)
                l = Math.max(l, this.getNexts(noReadNexts[n], l + 1));

        // Set this node as read
        node.read = true; //this.getPathNodeByID(node.id).read = true;

        return l;
    };

    this.log = function (text, param) {
        if (true) {
            if (param) console.log(text, param); else console.log(text);
        }
    };
};
module.exports = Path;