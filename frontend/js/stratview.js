"use strict";

let demoInfo = {};
let currentTick;
let connection;
let isRequesting = false;

class Map {
    constructor(name, offsetX, offsetY) {
        this.name = name;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }
}

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
                demoInfo.players = jmsg.players;
                for (let id in demoInfo.players) {
                    demoInfo.players[id].sprite = game.add.sprite(0, 0, 'ct');
                    demoInfo.players[id].sprite.scale.setTo(0.5, 0.5);
                    demoInfo.players[id].sprite.achor = Phaser.Point(0.5, 0.5);
                }
            }

            if(jmsg.type == "tickInfo") {
                currentTick = jmsg.ticknumber;
                for (let id in jmsg.players) {
                    demoInfo.players[id].sprite.x = jmsg.players[id].x/8;
                    demoInfo.players[id].sprite.y = jmsg.players[id].y/8;
                }
            }
        };
    }

    requestTick(ticknumber) {
        if (!isRequesting) {
            connection.send("tick " + ticknumber);
            isRequesting = true;
            setTimeout(() => { isRequesting = false; }, 25);
        }
    }

    preload() {
        this.game.load.image("dust2", "assets/dust2.png");
        this.game.load.image("nuke", "assets/nuke.png");
        this.game.load.image("inferno", "assets/inferno.png");
        this.game.load.image("overpass", "assets/overpass.png");
        this.game.load.image("mirage", "assets/mirage.png");
        this.game.load.image("cache", "assets/cache.png");
        this.game.load.image("cobble", "assets/cobble.png");
        this.game.load.image("train", "assets/train.png");

        this.game.load.image("ct", "assets/ct.png");

        let maps = {
            'dust2': { offsetX: 0, offsetY: 0 },
            'nuke': { offsetX: 0, offsetY: 0 },
            'inferno': { offsetX: 0, offsetY: 0 },
            'overpass': { offsetX: 0, offsetY: 0 },
            'mirage': { offsetX: 0, offsetY: 0 },
            'cache': { offsetX: 0, offsetY: 0 },
            'cobble': { offsetX: 0, offsetY: 0 },
            'train': { offsetX: 0, offsetY: 0 }
        };
    }

    create() {
        this.mapImage = this.game.add.sprite(-400, -400, 'mirage');
        this.mapImage.width = this.game.width;
        this.mapImage.height = this.game.height;
        this.camera.bounds = null;
        this.camera.setPosition(-400, -400);
        this.connectToServer();
    }

    update() {
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
            this.requestTick(currentTick + 8);
        }
    }
}

class Game extends Phaser.Game {
    constructor() {
        super(800, 800, Phaser.AUTO, 'content', new MainState());
    }
}

let game = new Game();
