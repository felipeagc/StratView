"use strict";
// REFERENCE:
// https://github.com/saul/gamevis/blob/master/importers/csgo/import.js#L204
// https://github.com/L33T/CSGO-Reflection/
// https://github.com/saul/demofile
let fs = require("fs");
let ws = require("nodejs-websocket");
let demofile = require("demofile");

let demos = [];
let wsServer;

function startWSServer() {
    wsServer = ws.createServer(function(conn) {
        console.log("New connection");
        conn.on("text", function(msg) {
            if (msg == "demoInfo") {
                let demoInfo = {
                    type: "demoInfo",
                    matchStartTick: demos[0].matchStartTick,
                    players: {}
                };
                demoInfo.players = demos[0].players;
                conn.sendText(JSON.stringify(demoInfo));
            }
            if (/(tick \d+)/g.test(msg)) {
                // Only runs if it's a tick request
                let ticknumber = parseInt(msg.split(' ')[1], 10);
                let tickInfo = {
                    type: "tickInfo",
                    ticknumber: ticknumber,
                    players: {}
                };
                for (let id in demos[0].ticks[ticknumber].players) {
                    let player = demos[0].ticks[ticknumber].players[id];
                    tickInfo.players[id] = player;
                }
                if (conn.readyState == conn.OPEN) {
                    conn.sendText(JSON.stringify(tickInfo));
                }
            }
        });
        conn.on("close", function(msg) {
            console.log("Connection closed");
        });
    }).listen(8001);
}

function broadcast(message) {
    if (wsServer != undefined) {
        wsServer.connections.forEach((conn) => {
            conn.sendText(message);
        });
    }
}

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}
class Tick {
    constructor(index) {
        // Players are accessed through their ids
        this.players = {};
        this.grenades = [];
    }
}

class Demo {
    constructor(path) {
        this.path = path;
        this.players = {};
        this.ticks = [];
        this.matchStartTick = undefined;
        this.demo = new demofile.DemoFile();
    }

    getTick(index) {
        if (this.ticks[index] == undefined) {
            this.ticks[index] = new Tick(index);
        }
        return this.ticks[index];
    }

    load() {
        fs.readFile(this.path, (err, buffer) => {
            this.demo.stringTables.on('update', (e) => {
                if (e.table.name === 'userinfo' && e.userData != null) {
                    console.log(e.entryIndex, e.userData);
                    if (e.userData.fakePlayer == false) {
                        this.players[e.entryIndex] = new Player(e.entryIndex, e.userData.name);
                    }
                }
            });

            this.demo.entities.on('change', (e) => {
                var fullPropName = `${e.tableName}.${e.varName}`;
                if (fullPropName === 'DT_CSLocalPlayerExclusive.m_vecOrigin[2]') {
                    var xyPos = e.entity.getProp('DT_CSLocalPlayerExclusive', 'm_vecOrigin');
                    if (xyPos == null) {
                        return;
                    }

                    let tick = this.getTick(this.demo.currentTick);
                    // Register information about this player at the current tick.
                    if (this.players[e.entity.index] != undefined) {
                        tick.players[e.entity.index] = {
                            x: xyPos.x,
                            y: xyPos.y
                        };
                    }
                }
            });

            this.demo.on('tickend', (e) => {
                process.stdout.write(this.demo.currentTick + " / " + this.demo.header.playbackTicks + "\r");
                for (let id in this.players) {
                    // If there were no changes for a player in the current tick

                }
            });

            this.demo.on('end', (e) => {
                this.postLoad();
            });

            this.demo.gameEvents.on('player_connect_full', (e) => {
                this.matchStartTick = this.demo.currentTick;
            });

            this.demo.parse(buffer);
        });
    }

    postLoad() {
        console.log("The end");
        for (let id in this.players) {
            let playerInfo = this.getPlayerInfo(id, 5000);
            console.log(id);
            console.log(this.players[id].name, playerInfo["x"], playerInfo["y"]);
        }
        console.log(this.matchStartTick);
        console.log(this.demo.header.playbackTicks / this.demo.header.playbackTime);
        startWSServer();
    }

    getPlayerInfo(id, ticknumber) {
        let keys = ["x", "y"];
        let playerInfo = {
            id: id
        };
        for (let i = ticknumber; i > 0; i--) {
            if (id == 1)
                console.log('c');
            let tick = this.getTick(i);
            if(tick.players[id] != undefined) {
                let to_remove = [];
                for (let kindex in keys) {
                    if (tick.players[id][keys[kindex]] != undefined) {
                        playerInfo[keys[kindex]] = tick.players[id][keys[kindex]];
                        to_remove.push(kindex);
                    }
                }
                for (let kindex in to_remove) {
                    keys.splice(kindex, 1);
                }
            }
            if (keys.length == 0) {
                break;
            }
        }
        return playerInfo;
    }
}

let demo = new Demo("demos/demo1.dem");
demos.push(demo);
demos[0].load();


