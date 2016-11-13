// REFERENCE:
// https://github.com/saul/gamevis/blob/master/importers/csgo/import.js#L204
// https://github.com/L33T/CSGO-Reflection/
// https://github.com/saul/demofile
import * as ws from "ws";
import {Player, TickPlayer, Tick, Demo} from "./demoparser";

let wsServer: ws.Server;

let demo = new Demo("demos/demo3.dem");
demo.parse(() => {
    wsServer = new ws.Server({ port: 8001 });
    wsServer.on("connection", (conn) => {
        console.log("New connection");
        conn.on("message", (msg) => {
            if (msg === "demoInfo") {
                let demoInfo = {
                    type: "demoInfo",
                    matchStartTick: demo.matchStartTick,
                    map: demo.demofile.header.mapName,
                    players: {}
                };
                demoInfo.players = demo.players;
                conn.send(JSON.stringify(demoInfo));
            }
            if (/(tick \d+)/g.test(msg)) {
                // "tick [index]"
                // Only runs if it's a tick request
                let ticknumber = parseInt(msg.split(" ")[1], 10);
                let tick = demo.getTick(ticknumber);
                tick["type"] = "tickInfo";
                if (conn.readyState === conn.OPEN) {
                    conn.send(JSON.stringify(tick));
                }
            }
        });
        conn.on("close", function(msg) {
            console.log("Connection closed");
        });
    });

});

function broadcast(message) {
    if (wsServer !== undefined) {
        wsServer.clients.forEach((conn) => {
            conn.send(message);
        });
    }
}

