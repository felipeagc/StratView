"use strict";
var fs = require("fs");
var demofile = require("demofile");
var Player = (function () {
    function Player(id, name) {
        this.name = name;
        this.id = id;
    }
    return Player;
}());
exports.Player = Player;
var TickPlayer = (function () {
    function TickPlayer(id) {
        this.id = id;
    }
    return TickPlayer;
}());
exports.TickPlayer = TickPlayer;
var Tick = (function () {
    function Tick(index) {
        this.tickPlayers = [];
        this.index = index;
    }
    return Tick;
}());
exports.Tick = Tick;
var Demo = (function () {
    function Demo(path) {
        this.players = [];
        this.ticks = [];
        this.currentTick = 0;
        this.matchStartTick = 0;
        this.path = path;
        this.demofile = new demofile.DemoFile();
    }
    Demo.prototype.getTick = function (index) {
        if (this.ticks[index] === undefined) {
            this.ticks[index] = new Tick(index);
        }
        return this.ticks[index];
    };
    Demo.prototype.parse = function (callback) {
        var _this = this;
        fs.readFile(this.path, function (err, buffer) {
            _this.demofile.stringTables.on("update", function (e) {
                if (e.table.name === "userinfo" && e.userData != null) {
                    console.log(e.entryIndex, e.userData);
                    if (e.userData.fakePlayer === false) {
                        _this.players[e.entryIndex] = new Player(e.entryIndex, e.userData.name);
                    }
                }
            });
            _this.demofile.entities.on("change", function (e) {
                var fullPropName = e.tableName + "." + e.varName;
                if (fullPropName === "DT_BasePlayer.m_lifeState") {
                    if (e.entity.getProp("DT_BasePlayer", "m_lifeState") === 0) {
                    }
                    else {
                    }
                }
                if (fullPropName === "DT_CSLocalPlayerExclusive.m_vecOrigin[2]") {
                    var xyPos = e.entity.getProp("DT_CSLocalPlayerExclusive", "m_vecOrigin");
                    if (xyPos == null) {
                        return;
                    }
                    var tick = _this.getTick(_this.demofile.currentTick);
                    if (_this.players[e.entity.index] !== undefined) {
                        var tickPlayer = new TickPlayer(e.entity.index);
                        tickPlayer.x = xyPos.x;
                        tickPlayer.y = xyPos.y;
                        tick.tickPlayers[e.entity.index] = tickPlayer;
                    }
                }
            });
            _this.demofile.on("tickend", function (e) {
                process.stdout.write(_this.demofile.currentTick + " / " + _this.demofile.header.playbackTicks + "\r");
                for (var id in _this.players) {
                }
            });
            _this.demofile.on("end", function (e) {
                console.log("Done parsing");
                callback();
            });
            _this.demofile.gameEvents.on("round_announce_match_start", function (e) {
                _this.matchStartTick = _this.demofile.currentTick;
            });
            _this.demofile.parse(buffer);
        });
    };
    return Demo;
}());
exports.Demo = Demo;
