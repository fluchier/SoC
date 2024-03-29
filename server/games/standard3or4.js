var Standard3or4 = function (options) {

    this.options = options,
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
        pieces: {
            road: 15, settlement: 5, city: 4, boat: 0, citywalls: 0
        },
        harvest: { settlement: 1, city: 2 },
        points: { settlement: 1, city: 2 },
        extra: { longestRoad: { condition: 5, points: 2 }, strongestKnight: { condition: 3, points: 2 } },
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
        normalTurn: ["ROLL_DICE", "TRADING", "BUILDING"],
        phaseToCanPlayDevCard: ["ROLL_DICE", "TRADING", "BUILDING"],
        resourceTradeCoef: { bricks: 4, lumber: 4, wool: 4, grain: 4, ore: 4 },
        resourceLimit: 7,
        victoryPoint: 10
    };
    this.world = {
        robber: { x: -4, y: 2 },
        tiles: [
            { x: 0, y: 0, type: "PASTURE", value: 11 },

            { x: 0, y: 2, type: "FIELDS", value: 6 },
            { x: 2, y: 1, type: "PASTURE", value: 5 },
            { x: 2, y: -1, type: "HILLS", value: 9 },
            { x: 0, y: -2, type: "FOREST", value: 4 },
            { x: -2, y: -1, type: "MOUNTAINS", value: 3 },
            { x: -2, y: 1, type: "PASTURE", value: 10 },

            { x: 0, y: 4, type: "HILLS", value: 11 },
            { x: 2, y: 3, type: "FIELDS", value: 2 },
            { x: 4, y: 2, type: "MOUNTAINS", value: 9 },
            { x: 4, y: 0, type: "FIELDS", value: 10 },
            { x: 4, y: -2, type: "FOREST", value: 8 },
            { x: 2, y: -3, type: "PASTURE", value: 3 },
            { x: 0, y: -4, type: "FOREST", value: 6 },
            { x: -2, y: -3, type: "FIELDS", value: 12 },
            { x: -4, y: -2, type: "MOUNTAINS", value: 5 },
            { x: -4, y: 0, type: "FOREST", value: 8 },
            { x: -4, y: 2, type: "DESERT", value: 0 },
            { x: -2, y: 3, type: "HILLS", value: 4 },

            { x: 0, y: 6, type: "SEA", value: 0, harbor: "*" },
            { x: 2, y: 5, type: "SEA", value: 0, harbor: "no" },
            { x: 4, y: 4, type: "SEA", value: 0, harbor: "*" },
            { x: 6, y: 3, type: "SEA", value: 0, harbor: "no" },
            { x: 6, y: 1, type: "SEA", value: 0, harbor: "wool" },
            { x: 6, y: -1, type: "SEA", value: 0, harbor: "no" },
            { x: 6, y: -3, type: "SEA", value: 0, harbor: "*" },
            { x: 4, y: -4, type: "SEA", value: 0, harbor: "no" },
            { x: 2, y: -5, type: "SEA", value: 0, harbor: "grain" },
            { x: 0, y: -6, type: "SEA", value: 0, harbor: "no" },
            { x: -2, y: -5, type: "SEA", value: 0, harbor: "bricks" },
            { x: -4, y: -4, type: "SEA", value: 0, harbor: "no" },
            { x: -6, y: -3, type: "SEA", value: 0, harbor: "*" },
            { x: -6, y: -1, type: "SEA", value: 0, harbor: "no" },
            { x: -6, y: 1, type: "SEA", value: 0, harbor: "lumber" },
            { x: -6, y: 3, type: "SEA", value: 0, harbor: "no" },
            { x: -4, y: 4, type: "SEA", value: 0, harbor: "ore" },
            { x: -2, y: 5, type: "SEA", value: 0, harbor: "no" },
        ],
        nodes: [],
        roads: [
            { id: 1, player: { index: -1, username: "" }, nodes: [{ i: -1, j: 1 }, { i: 1, j: 1 }] },
            { id: 2, player: { index: -1, username: "" }, nodes: [{ i: 1, j: 1 }, { i: 1, j: 0 }] },
            { id: 3, player: { index: -1, username: "" }, nodes: [{ i: 1, j: 0 }, { i: 1, j: -1 }] },
            { id: 4, player: { index: -1, username: "" }, nodes: [{ i: 1, j: -1 }, { i: -1, j: -1 }] },
            { id: 5, player: { index: -1, username: "" }, nodes: [{ i: -1, j: -1 }, { i: -1, j: 0 }] },
            { id: 6, player: { index: -1, username: "" }, nodes: [{ i: -1, j: 0 }, { i: -1, j: 1 }] },

            { id: 7, player: { index: -1, username: "" }, nodes: [{ i: -1, j: 1 }, { i: -1, j: 2 }] },
            { id: 8, player: { index: -1, username: "" }, nodes: [{ i: 1, j: 1 }, { i: 1, j: 2 }] },
            { id: 9, player: { index: -1, username: "" }, nodes: [{ i: 1, j: 0 }, { i: 3, j: 0 }] },
            { id: 10, player: { index: -1, username: "" }, nodes: [{ i: 1, j: -1 }, { i: 1, j: -2 }] },
            { id: 11, player: { index: -1, username: "" }, nodes: [{ i: -1, j: -1 }, { i: -1, j: -2 }] },
            { id: 12, player: { index: -1, username: "" }, nodes: [{ i: -1, j: 0 }, { i: -3, j: 0 }] },

            { id: 13, player: { index: -1, username: "" }, nodes: [{ i: -3, j: 0 }, { i: -3, j: 1 }] },
            { id: 14, player: { index: -1, username: "" }, nodes: [{ i: -3, j: 1 }, { i: -3, j: 2 }] },
            { id: 15, player: { index: -1, username: "" }, nodes: [{ i: -3, j: 2 }, { i: -1, j: 2 }] },
            { id: 16, player: { index: -1, username: "" }, nodes: [{ i: -1, j: 2 }, { i: -1, j: 3 }] },
            { id: 17, player: { index: -1, username: "" }, nodes: [{ i: -1, j: 3 }, { i: 1, j: 3 }] },
            { id: 18, player: { index: -1, username: "" }, nodes: [{ i: 1, j: 3 }, { i: 1, j: 2 }] },
            { id: 19, player: { index: -1, username: "" }, nodes: [{ i: 1, j: 2 }, { i: 3, j: 2 }] },
            { id: 20, player: { index: -1, username: "" }, nodes: [{ i: 3, j: 2 }, { i: 3, j: 1 }] },
            { id: 21, player: { index: -1, username: "" }, nodes: [{ i: 3, j: 1 }, { i: 3, j: 0 }] },
            { id: 22, player: { index: -1, username: "" }, nodes: [{ i: 3, j: 0 }, { i: 3, j: -1 }] },
            { id: 23, player: { index: -1, username: "" }, nodes: [{ i: 3, j: -1 }, { i: 3, j: -2 }] },
            { id: 24, player: { index: -1, username: "" }, nodes: [{ i: 3, j: -2 }, { i: 1, j: -2 }] },
            { id: 25, player: { index: -1, username: "" }, nodes: [{ i: 1, j: -2 }, { i: 1, j: -3 }] },
            { id: 26, player: { index: -1, username: "" }, nodes: [{ i: 1, j: -3 }, { i: -1, j: -3 }] },
            { id: 27, player: { index: -1, username: "" }, nodes: [{ i: -1, j: -3 }, { i: -1, j: -2 }] },
            { id: 28, player: { index: -1, username: "" }, nodes: [{ i: -1, j: -2 }, { i: -3, j: -2 }] },
            { id: 29, player: { index: -1, username: "" }, nodes: [{ i: -3, j: -2 }, { i: -3, j: -1 }] },
            { id: 30, player: { index: -1, username: "" }, nodes: [{ i: -3, j: -1 }, { i: -3, j: 0 }] },

            { id: 31, player: { index: -1, username: "" }, nodes: [{ i: -3, j: 1 }, { i: -5, j: 1 }] },
            { id: 32, player: { index: -1, username: "" }, nodes: [{ i: -3, j: 2 }, { i: -3, j: 3 }] },
            { id: 33, player: { index: -1, username: "" }, nodes: [{ i: -1, j: 3 }, { i: -1, j: 4 }] },
            { id: 34, player: { index: -1, username: "" }, nodes: [{ i: 1, j: 3 }, { i: 1, j: 4 }] },
            { id: 35, player: { index: -1, username: "" }, nodes: [{ i: 3, j: 2 }, { i: 3, j: 3 }] },
            { id: 36, player: { index: -1, username: "" }, nodes: [{ i: 3, j: 1 }, { i: 5, j: 1 }] },
            { id: 37, player: { index: -1, username: "" }, nodes: [{ i: 3, j: -1 }, { i: 5, j: -1 }] },
            { id: 38, player: { index: -1, username: "" }, nodes: [{ i: 3, j: -2 }, { i: 3, j: -3 }] },
            { id: 39, player: { index: -1, username: "" }, nodes: [{ i: 1, j: -3 }, { i: 1, j: -4 }] },
            { id: 40, player: { index: -1, username: "" }, nodes: [{ i: -1, j: -3 }, { i: -1, j: -4 }] },
            { id: 41, player: { index: -1, username: "" }, nodes: [{ i: -3, j: -2 }, { i: -3, j: -3 }] },
            { id: 42, player: { index: -1, username: "" }, nodes: [{ i: -3, j: -1 }, { i: -5, j: -1 }] },

            { id: 43, player: { index: -1, username: "" }, nodes: [{ i: -5, j: 1 }, { i: -5, j: 2 }] },
            { id: 44, player: { index: -1, username: "" }, nodes: [{ i: -5, j: 2 }, { i: -5, j: 3 }] },
            { id: 45, player: { index: -1, username: "" }, nodes: [{ i: -5, j: 3 }, { i: -3, j: 3 }] },
            { id: 46, player: { index: -1, username: "" }, nodes: [{ i: -3, j: 3 }, { i: -3, j: 4 }] },
            { id: 47, player: { index: -1, username: "" }, nodes: [{ i: -3, j: 4 }, { i: -1, j: 4 }] },
            { id: 48, player: { index: -1, username: "" }, nodes: [{ i: -1, j: 4 }, { i: -1, j: 5 }] },
            { id: 49, player: { index: -1, username: "" }, nodes: [{ i: -1, j: 5 }, { i: 1, j: 5 }] },
            { id: 50, player: { index: -1, username: "" }, nodes: [{ i: 1, j: 5 }, { i: 1, j: 4 }] },
            { id: 51, player: { index: -1, username: "" }, nodes: [{ i: 1, j: 4 }, { i: 3, j: 4 }] },
            { id: 52, player: { index: -1, username: "" }, nodes: [{ i: 3, j: 4 }, { i: 3, j: 3 }] },
            { id: 53, player: { index: -1, username: "" }, nodes: [{ i: 3, j: 3 }, { i: 5, j: 3 }] },
            { id: 54, player: { index: -1, username: "" }, nodes: [{ i: 5, j: 3 }, { i: 5, j: 2 }] },
            { id: 55, player: { index: -1, username: "" }, nodes: [{ i: 5, j: 2 }, { i: 5, j: 1 }] },
            { id: 56, player: { index: -1, username: "" }, nodes: [{ i: 5, j: 1 }, { i: 5, j: 0 }] },
            { id: 57, player: { index: -1, username: "" }, nodes: [{ i: 5, j: 0 }, { i: 5, j: -1 }] },
            { id: 58, player: { index: -1, username: "" }, nodes: [{ i: 5, j: -1 }, { i: 5, j: -2 }] },
            { id: 59, player: { index: -1, username: "" }, nodes: [{ i: 5, j: -2 }, { i: 5, j: -3 }] },
            { id: 60, player: { index: -1, username: "" }, nodes: [{ i: 5, j: -3 }, { i: 3, j: -3 }] },
            { id: 61, player: { index: -1, username: "" }, nodes: [{ i: 3, j: -3 }, { i: 3, j: -4 }] },
            { id: 62, player: { index: -1, username: "" }, nodes: [{ i: 3, j: -4 }, { i: 1, j: -4 }] },
            { id: 63, player: { index: -1, username: "" }, nodes: [{ i: 1, j: -4 }, { i: 1, j: -5 }] },
            { id: 64, player: { index: -1, username: "" }, nodes: [{ i: 1, j: -5 }, { i: -1, j: -5 }] },
            { id: 65, player: { index: -1, username: "" }, nodes: [{ i: -1, j: -5 }, { i: -1, j: -4 }] },
            { id: 66, player: { index: -1, username: "" }, nodes: [{ i: -1, j: -4 }, { i: -3, j: -4 }] },
            { id: 67, player: { index: -1, username: "" }, nodes: [{ i: -3, j: -4 }, { i: -3, j: -3 }] },
            { id: 68, player: { index: -1, username: "" }, nodes: [{ i: -3, j: -3 }, { i: -5, j: -3 }] },
            { id: 69, player: { index: -1, username: "" }, nodes: [{ i: -5, j: -3 }, { i: -5, j: -2 }] },
            { id: 70, player: { index: -1, username: "" }, nodes: [{ i: -5, j: -2 }, { i: -5, j: -1 }] },
            { id: 71, player: { index: -1, username: "" }, nodes: [{ i: -5, j: -1 }, { i: -5, j: 0 }] },
            { id: 72, player: { index: -1, username: "" }, nodes: [{ i: -5, j: 0 }, { i: -5, j: 1 }] }
        ],
        playerroads: {}
    };
};
module.exports = Standard3or4;