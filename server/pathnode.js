var PathNode = function (nodes) {

    this.id = nodes[0].i + "_" + nodes[0].j + "_" + nodes[1].i + "_" + nodes[1].j;

    this.extremities = [
        {
            i: nodes[0].i,
            j: nodes[0].j,
            connectedTo: -1
        },
        {
            i: nodes[0].i,
            j: nodes[0].j,
            connectedTo: -1
        },
        {
            i: nodes[1].i,
            j: nodes[1].j,
            connectedTo: -1
        },
        {
            i: nodes[1].i,
            j: nodes[1].j,
            connectedTo: -1
        }

    ];

    this.read = false;
    this.reset = function () {
        this.read = false;
    };

    this.isStartOrEnd = function () {
        return (this.extremities[0].connectedTo == -1 && this.extremities[1].connectedTo == -1) || (this.extremities[2].connectedTo == -1 && this.extremities[3].connectedTo == -1);
    };

    this.getNexts = function () {
        var nexts = [];
        for (var n = 0; n < this.extremities.length; n++) {
            var extremity = this.extremities[n];
            if (extremity.connectedTo != -1)
                nexts.push(extremity.connectedTo);
        }
        return nexts;
    };

    this.log = function (text, param) {
        if (true) {
            if (param) console.log(text, param); else console.log(text);
        }
    };
};
module.exports = PathNode;