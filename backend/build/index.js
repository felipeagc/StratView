"use strict";
var ws = require("ws");
var demoparser_1 = require("./demoparser");
var wsServer;
var demo = new demoparser_1.Demo("demos/demo3.dem");
demo.parse(function () {
    wsServer = new ws.Server({ port: 8001 });
    wsServer.on("connection", function (conn) {
        console.log("New connection");
        conn.on("message", function (msg) {
            if (msg === "demoInfo") {
                var demoInfo = {
                    type: "demoInfo",
                    matchStartTick: demo.matchStartTick,
                    map: demo.demofile.header.mapName,
                    players: {}
                };
                demoInfo.players = demo.players;
                conn.send(JSON.stringify(demoInfo));
            }
            if (/(tick \d+)/g.test(msg)) {
                var ticknumber = parseInt(msg.split(" ")[1], 10);
                var tick = demo.getTick(ticknumber);
                tick["type"] = "tickInfo";
                if (conn.readyState === conn.OPEN) {
                    conn.send(JSON.stringify(tick));
                }
            }
        });
        conn.on("close", function (msg) {
            console.log("Connection closed");
        });
    });
});
function broadcast(message) {
    if (wsServer !== undefined) {
        wsServer.clients.forEach(function (conn) {
            conn.send(message);
        });
    }
}
