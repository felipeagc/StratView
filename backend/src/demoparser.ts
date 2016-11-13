"use strict";

import * as fs from "fs";
let demofile = require("demofile");

export class Player {
    name: string;
    id: number;

    constructor(id: number, name: string) {
        this.name = name;
        this.id = id;
    }
}

export class TickPlayer {
    id: number;
    x: number;
    y: number;
    angle: number;
    weapon: string;
    slow: boolean;

    constructor(id: number) {
        this.id = id;
    }
}

export class Tick {
    index: number;
    tickPlayers: Array<TickPlayer> = [];

    constructor(index: number) {
        this.index = index;
    }
}

export class Demo {
    path: string;
    players: Array<Player> = [];
    ticks: Array<Tick> = [];
    currentTick: number = 0;
    demofile: any;
    matchStartTick: number = 0;

    constructor(path: string) {
        this.path = path;
        this.demofile = new demofile.DemoFile();
    }

    getTick(index: number): Tick {
        if (this.ticks[index] === undefined) {
            this.ticks[index] = new Tick(index);
        }
        return this.ticks[index];
    }

    parse(callback: () => void) {
        fs.readFile(this.path, (err, buffer) => {
            this.demofile.stringTables.on("update", (e) => {
                if (e.table.name === "userinfo" && e.userData != null) {
                    console.log(e.entryIndex, e.userData);
                    if (e.userData.fakePlayer === false) {
                        this.players[e.entryIndex] = new Player(e.entryIndex, e.userData.name);
                    }
                }
            });

            this.demofile.entities.on("change", (e) => {
                let fullPropName = `${e.tableName}.${e.varName}`;
                if (fullPropName === "DT_BasePlayer.m_lifeState") {
                    if (e.entity.getProp("DT_BasePlayer", "m_lifeState") === 0) {
                        // Dead
                    } else {
                        // Alive
                    }
                }
                if (fullPropName === "DT_CSLocalPlayerExclusive.m_vecOrigin[2]") {
                    let xyPos = e.entity.getProp("DT_CSLocalPlayerExclusive", "m_vecOrigin");
                    if (xyPos == null) {
                        return;
                    }

                    let tick = this.getTick(this.demofile.currentTick);
                    // Register information about this player at the current tick.
                    if (this.players[e.entity.index] !== undefined) {
                        let tickPlayer = new TickPlayer(e.entity.index);
                        tickPlayer.x = xyPos.x;
                        tickPlayer.y = xyPos.y;
                        tick.tickPlayers[e.entity.index] = tickPlayer;
                    }
                }
            });

            this.demofile.on("tickend", (e) => {
                process.stdout.write(this.demofile.currentTick + " / " + this.demofile.header.playbackTicks + "\r");
                for (let id in this.players) {
                    // If there were no changes for a player in the current tick

                }
            });

            this.demofile.on("end", (e) => {
                console.log("Done parsing");
                callback();
            });

            this.demofile.gameEvents.on("round_announce_match_start", (e) => {
                this.matchStartTick = this.demofile.currentTick;
            });

            this.demofile.parse(buffer);
        });
    }
}
