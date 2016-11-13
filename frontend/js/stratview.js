"use strict";

let demoInfo = {};
let currentTick;
let connection;
let isRequesting = false;

let scale = 0.148;

class Map {
    constructor(name, offsetX, offsetY) {
        this.name = name;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }
}

let maps = {
    "de_mirage": new Map("de_mirage", 91, 147),
    "de_cbble": new Map("de_cbble", 0, 0),
    "de_inferno": new Map("de_inferno", 0, 0),
    "de_dust2": new Map("de_dust2", 0, 0),
    "de_nuke": new Map("de_nuke", 91, 147),
    "de_train": new Map("de_train", 0, 0),
    "de_cache": new Map("de_cache", 0, 0),
    "de_overpass": new Map("de_overpass", 311, 131)
};

class MainState extends Phaser.State {

    connectToServer() {
        connection = new WebSocket("ws://localhost:8001");

        connection.onopen = () => {
            connection.send("demoInfo");
        };

        connection.onmessage = (msg) => {
            let jmsg = JSON.parse(msg.data);
            if(jmsg.type == "demoInfo") {
                currentTick = jmsg.matchStartTick;
                console.log(currentTick);
                this.currentMap = maps[jmsg.map];
                this.mapImage = this.game.add.sprite(-400, -400, this.currentMap.name);
                this.mapImage.width = this.game.width;
                this.mapImage.height = this.game.height;
                demoInfo.players = jmsg.players;
                for (let id in demoInfo.players) {
                    if (demoInfo.players[id] !== null) {
                        demoInfo.players[id].x = 0;
                        demoInfo.players[id].y = 0;
                        demoInfo.players[id].sprite = game.add.sprite(0, 0, 'ct');
                        demoInfo.players[id].sprite.scale.setTo(0.5, 0.5);
                        demoInfo.players[id].sprite.achor = Phaser.Point(0.5, 0.5);
                    }
                }
            }

            if(jmsg.type == "tickInfo") {
                currentTick = jmsg.index;
                for (let id in jmsg.tickPlayers) {
                    if (jmsg.tickPlayers[id] !== null) {
                        demoInfo.players[id].x = jmsg.tickPlayers[id].x;
                        demoInfo.players[id].y = jmsg.tickPlayers[id].y;
                    }
                }
                console.log("new tickinfo");
            }
        };
    }

    requestTick(ticknumber) {
        if (!isRequesting) {
            connection.send("tick " + ticknumber);
            isRequesting = true;
            setTimeout(() => { isRequesting = false; }, 16);
        }
    }

    preload() {
        for (let mapName in maps) {
            this.game.load.image(mapName, "assets/" + mapName + ".png");
        }

        this.game.load.image("ct", "assets/ct.png");
    }

    create() {
        this.camera.bounds = null;
        this.camera.setPosition(-400, -400);
        this.connectToServer();
    }

    update() {
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
            this.requestTick(currentTick + 8);
        }
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
            this.requestTick(currentTick - 8);
        }
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.A)) {
            this.currentMap.offsetX--;
        }
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.D)) {
            this.currentMap.offsetX++;
        }
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
            this.currentMap.offsetY++;
        }
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.S)) {
            this.currentMap.offsetY--;
        }
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.R)) {
            scale += (game.time.elapsed/1000)/10;
        }
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.F)) {
            scale -= (game.time.elapsed/1000)/10;
        }
        for (var id in demoInfo.players) {
            if (demoInfo.players[id] !== null) {
                let player = demoInfo.players[id];
                let sprite = player.sprite;
                sprite.x = player.x * scale;
                sprite.y = player.y * scale;
                sprite.x = sprite.x + this.currentMap.offsetX;
                sprite.y = sprite.y + this.currentMap.offsetY;
                sprite.y *= -1;
            }
        }
    }
}

class Game extends Phaser.Game {
    constructor() {
        super(800, 800, Phaser.AUTO, 'content', new MainState());
    }
}

let game = new Game();
