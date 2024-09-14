/// <reference path="Photon/photon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// For Photon Cloud Application access create cloud-app-info.js file in the root directory (next to default.html) and place next lines in it:
//var AppInfo = {
//    MasterAddress: "master server address:port",
//    AppId: "your app id",
//    AppVersion: "your app version",
//}
// fetching app info global variable while in global context
var DemoWss = this["AppInfo"] && this["AppInfo"]["Wss"];
var DemoAppId = this["AppInfo"] && this["AppInfo"]["AppId"] ? this["AppInfo"]["AppId"] : "<no-app-id>";
var DemoAppVersion = this["AppInfo"] && this["AppInfo"]["AppVersion"] ? this["AppInfo"]["AppVersion"] : "1.0";
var DemoMasterServer = this["AppInfo"] && this["AppInfo"]["MasterServer"];
var DemoNameServer = this["AppInfo"] && this["AppInfo"]["NameServer"];
var DemoRegion = this["AppInfo"] && this["AppInfo"]["Region"];
var DemoFbAppId = this["AppInfo"] && this["AppInfo"]["FbAppId"];
var ConnectOnStart = false;
var DemoLoadBalancing = /** @class */ (function (_super) {
    __extends(DemoLoadBalancing, _super);
    function DemoLoadBalancing() {
        var _this = _super.call(this, DemoWss ? Photon.ConnectionProtocol.Wss : Photon.ConnectionProtocol.Ws, DemoAppId, DemoAppVersion) || this;
        _this.logger = new Photon.Logger("Demo:");
        _this.USERCOLORS = ["#FF0000", "#00AA00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF"];
        _this.logger.info("Photon Version: " + Photon.Version + (Photon.IsEmscriptenBuild ? "-em" : ""));
        // uncomment to use Custom Authentication
        // this.setCustomAuthentication("username=" + "yes" + "&token=" + "yes");
        _this.output(_this.logger.format("Init", _this.getNameServerAddress(), DemoAppId, DemoAppVersion));
        _this.logger.info("Init", _this.getNameServerAddress(), DemoAppId, DemoAppVersion);
        _this.setLogLevel(Photon.LogLevel.INFO);
        _this.myActor().setCustomProperty("color", _this.USERCOLORS[0]);
        return _this;
    }
    DemoLoadBalancing.prototype.start = function () {
        this.setupUI();
        // connect if no fb auth required
        if (ConnectOnStart) {
            if (DemoMasterServer) {
                this.setMasterServerAddress(DemoMasterServer);
                this.connect();
            }
            if (DemoNameServer) {
                this.setNameServerAddress(DemoNameServer);
                this.connectToRegionMaster(DemoRegion || "EU");
            }
            else {
                this.connectToRegionMaster(DemoRegion || "EU");
                //this.connectToNameServer({ region: "EU", lobbyType: Photon.LoadBalancing.Constants.LobbyType.Default });
            }
        }
    };
    DemoLoadBalancing.prototype.onError = function (errorCode, errorMsg) {
        this.output("Error " + errorCode + ": " + errorMsg);
    };
    DemoLoadBalancing.prototype.onEvent = function (code, content, actorNr) {
        switch (code) {
            case 1:
                var mess = content.message + " " + this.getRtt() + " " + Math.floor(this.getServerTimeMs() / 1000);
                var sender = content.senderName;
                if (actorNr)
                    this.output(sender + ": " + mess, this.myRoomActors()[actorNr].getCustomProperty("color"));
                else
                    this.output(sender + ": " + mess);
                break;
            default:
        }
        this.logger.debug("onEvent", code, "content:", content, "actor:", actorNr);
    };
    DemoLoadBalancing.prototype.onStateChange = function (state) {
        // "namespace" import for static members shorter acceess
        var LBC = Photon.LoadBalancing.LoadBalancingClient;
        var stateText = document.getElementById("statetxt");
        stateText.textContent = LBC.StateToName(state);
        this.updateRoomButtons();
        this.updateRoomInfo();
    };
    DemoLoadBalancing.prototype.objToStr = function (x) {
        var res = "";
        for (var i in x) {
            res += (res == "" ? "" : " ,") + i + "=" + x[i];
        }
        return res;
    };
    DemoLoadBalancing.prototype.updateRoomInfo = function () {
        var stateText = document.getElementById("roominfo");
        var r = this.myRoom();
        stateText.innerHTML = "room: " + r.name + " [" + r.isOpen + " " + r.isVisible + " " + r.masterClientId + " " + r.maxPlayers + " " + r.roomTTL + " " + r.playerTTL
            + "] [" + this.objToStr(r.getCustomProperties())
            + "] [" + r.getPropsListedInLobby()
            + "] [" + r.expectedUsers
            + "]";
        stateText.innerHTML = stateText.innerHTML + "<br>";
        stateText.innerHTML += " actors: ";
        stateText.innerHTML = stateText.innerHTML + "<br>";
        for (var nr in this.myRoomActors()) {
            var a = this.myRoomActors()[nr];
            stateText.innerHTML += " " + nr + " " + a.name + " [" + this.objToStr(a.getCustomProperties()) + "]";
            stateText.innerHTML = stateText.innerHTML + "<br>";
        }
        this.updateRoomButtons();
    };
    DemoLoadBalancing.prototype.onActorPropertiesChange = function (actor) {
        this.updateRoomInfo();
    };
    DemoLoadBalancing.prototype.onMyRoomPropertiesChange = function () {
        this.updateRoomInfo();
    };
    DemoLoadBalancing.prototype.onRoomListUpdate = function (rooms, roomsUpdated, roomsAdded, roomsRemoved) {
        this.logger.info("Demo: onRoomListUpdate", rooms, roomsUpdated, roomsAdded, roomsRemoved);
        this.output("Demo: Rooms update: " + roomsUpdated.length + " updated, " + roomsAdded.length + " added, " + roomsRemoved.length + " removed");
        this.onRoomList(rooms);
        this.updateRoomButtons(); // join btn state can be changed
    };
    DemoLoadBalancing.prototype.onRoomList = function (rooms) {
        var menu = document.getElementById("gamelist");
        while (menu.firstChild) {
            menu.removeChild(menu.firstChild);
        }
        var selectedIndex = 0;
        for (var i = 0; i < rooms.length; ++i) {
            var r = rooms[i];
            var item = document.createElement("option");
            item.attributes["value"] = r.name;
            item.textContent = r.name;
            menu.appendChild(item);
            if (this.myRoom().name == r.name) {
                selectedIndex = i;
            }
        }
        menu.selectedIndex = selectedIndex;
        this.output("Demo: Rooms total: " + rooms.length);
        this.updateRoomButtons();
    };
    DemoLoadBalancing.prototype.onJoinRoom = function () {
        this.output("Game " + this.myRoom().name + " joined");
        this.updateRoomInfo();
    };
    DemoLoadBalancing.prototype.onActorJoin = function (actor) {
        this.output("actor " + actor.actorNr + " joined");
        this.updateRoomInfo();
    };
    DemoLoadBalancing.prototype.onActorLeave = function (actor) {
        this.output("actor " + actor.actorNr + " left");
        this.updateRoomInfo();
    };
    DemoLoadBalancing.prototype.sendMessage = function (message) {
        try {
            this.raiseEvent(1, { message: message, senderName: "user" + this.myActor().actorNr });
            this.output('me[' + this.myActor().actorNr + ']: ' + message, this.myActor().getCustomProperty("color"));
        }
        catch (err) {
            this.output("error: " + err.message);
        }
    };
    DemoLoadBalancing.prototype.setupUI = function () {
        var _this = this;
        this.logger.info("Setting up UI.");
        var input = document.getElementById("input");
        input.value = 'hello';
        input.focus();
        var btnJoin = document.getElementById("joingamebtn");
        btnJoin.onclick = function (ev) {
            if (_this.isInLobby()) {
                var menu = document.getElementById("gamelist");
                var gameId = menu.children[menu.selectedIndex].textContent;
                var expectedUsers = document.getElementById("expectedusers");
                _this.output(gameId);
                _this.joinRoom(gameId, { expectedUsers: expectedUsers.value.length > 0 ? expectedUsers.value.split(",") : undefined });
            }
            else {
                _this.output("Reload page to connect to Master");
            }
            return false;
        };
        var btnJoinOrCreate = document.getElementById("joinorcreategamebtn");
        btnJoinOrCreate.onclick = function (ev) {
            if (_this.isInLobby()) {
                var gameId = document.getElementById("newgamename");
                var expectedUsers = document.getElementById("expectedusers");
                _this.output(gameId.value);
                _this.joinRoom(gameId.value.length > 0 ? gameId.value : undefined, { createIfNotExists: true, expectedUsers: expectedUsers.value.length > 0 ? expectedUsers.value.split(",") : undefined }, { roomTTL: 20000, playerTTL: 20000, maxPlayers: 6 });
                //this.joinRoom(gameId.value.length > 0 ? gameId.value : undefined, { createIfNotExists: true });
            }
            else {
                _this.output("Reload page to connect to Master");
            }
            return false;
        };
        var btnJoinRandom = document.getElementById("joinrandomgamebtn");
        btnJoinRandom.onclick = function (ev) {
            if (_this.isInLobby()) {
                _this.output("Random Game or Create...");
                var name = document.getElementById("newgamename");
                var expectedUsers = document.getElementById("expectedusers");
                _this.joinRandomOrCreateRoom({ expectedMaxPlayers: 5, expectedUsers: expectedUsers.value.length > 0 ? expectedUsers.value.split(",") : undefined }, name.value.length > 0 ? name.value : undefined, { roomTTL: 20000, playerTTL: 20000, maxPlayers: 6 });
            }
            else {
                _this.output("Reload page to connect to Master");
            }
            return false;
        };
        var btnNew = document.getElementById("newgamebtn");
        btnNew.onclick = function (ev) {
            if (_this.isInLobby()) {
                var name = document.getElementById("newgamename");
                _this.output("New Game");
                var expectedUsers = document.getElementById("expectedusers");
                //this.createRoom(name.value.length > 0 ? name.value : undefined, { isOpen: true, isVisible: true, roomTTL: 20000, playerTTL: 20000, expectedUsers: expectedUsers.value.length > 0 ? expectedUsers.value.split(",") : undefined, maxPlayers: 6, propsListedInLobby: ["p1", "p2"], customGameProperties: { "_n": 1, "_n2": "n2 val", "_n3": true } });
                _this.createRoom(name.value.length > 0 ? name.value : undefined);
            }
            else {
                _this.output("Reload page to connect to Master");
            }
            return false;
        };
        var btnSetExpectedUsers = document.getElementById("setexpectedusers");
        btnSetExpectedUsers.onclick = function (ev) {
            _this.myRoom().setExpectedUsers(document.getElementById("expectedusers").value.split(","));
        };
        var btnClearExpectedUsers = document.getElementById("clearexpectedusers");
        btnClearExpectedUsers.onclick = function (ev) {
            _this.myRoom().clearExpectedUsers();
        };
        var form = document.getElementById("mainfrm");
        form.onsubmit = function () {
            if (_this.isJoinedToRoom()) {
                var input = document.getElementById("input");
                _this.sendMessage(input.value);
                input.value = '';
                input.focus();
            }
            else {
                if (_this.isInLobby()) {
                    _this.output("Press Join or New Game to connect to Game");
                }
                else {
                    _this.output("Reload page to connect to Master");
                }
            }
            return false;
        };
        var btn = document.getElementById("leavebtn");
        btn.onclick = function (ev) {
            _this.leaveRoom();
            return false;
        };
        document.getElementById("disconnectbtn").onclick = function (ev) { return _this.disconnect(); };
        document.getElementById("remasterbtn").onclick = function (ev) { return _this.reconnectToMaster(); };
        document.getElementById("regamebtn").onclick = function (ev) { return _this.reconnectAndRejoin(); };
        btn = document.getElementById("colorbtn");
        btn.onclick = function (ev) {
            var ind = Math.floor(Math.random() * _this.USERCOLORS.length);
            var color = _this.USERCOLORS[ind];
            _this.myActor().setCustomProperty("color", color);
            _this.sendMessage("... changed his / her color!");
        };
        btn = document.getElementById("testbtn");
        btn.onclick = function (ev) {
            _this.myRoom().setMaxPlayers((_this.myRoom().maxPlayers || _this.myRoomActorsArray().length) + 1);
            _this.myRoom().setIsVisible(!_this.myRoom().isVisible);
            _this.myRoom().setIsOpen(!_this.myRoom().isOpen);
            _this.myRoom().setRoomTTL(_this.myRoom().roomTTL + 1000);
            _this.myRoom().setPlayerTTL(_this.myRoom().playerTTL + 2000);
            _this.myRoom().setExpectedUsers((_this.myRoom().expectedUsers || []).concat("u" + (_this.myRoom().expectedUsers || []).length));
            _this.myRoom().setPropsListedInLobby((_this.myRoom().getPropsListedInLobby() || []).concat("l"));
            _this.myRoom().setMasterClient(_this.myRoomActorsArray()[Math.floor(Math.random() * _this.myRoomActorsArray().length)].actorNr);
            _this.myActor().setName(_this.myActor().name + " ! ");
            var n, p, n1, n2, p1, p2, prop, expected;
            var setPropTest = function (actorOrRoom) {
                n = "n";
                n1 = "n1";
                n2 = "n2";
                p = actorOrRoom.getCustomProperty(n);
                p1 = actorOrRoom.getCustomProperty(n1);
                p2 = actorOrRoom.getCustomProperty(n2);
                prop = {};
                prop[n1] = (p1 || "p1") + (p1 || "").length;
                prop[n2] = (p2 || "p2") + (p2 || "").length;
                expected = {};
                expected[n1] = p1 === void 0 ? null : p1;
                expected[n2] = p2 === void 0 ? null : p2;
            };
            setPropTest(_this.myActor());
            _this.myActor().setCustomProperty(n, (p || "p") + (p || "").length, true, p);
            _this.myActor().setCustomProperties(prop, true, expected);
            setPropTest(_this.myRoom());
            _this.myRoom().setCustomProperty(n, (p || "p") + (p || "").length, true, p);
            _this.myRoom().setCustomProperties(prop, true, expected);
            _this.sendMessage("... test: " + _this.myRoom().maxPlayers);
        };
        this.updateRoomButtons();
    };
    DemoLoadBalancing.prototype.output = function (str, color) {
        var log = document.getElementById("theDialogue");
        var escaped = str.replace(/&/, "&amp;").replace(/</, "&lt;").
            replace(/>/, "&gt;").replace(/"/, "&quot;");
        if (color) {
            escaped = "<FONT COLOR='" + color + "'>" + escaped + "</FONT>";
        }
        log.innerHTML = log.innerHTML + escaped + "<br>";
        log.scrollTop = log.scrollHeight;
    };
    DemoLoadBalancing.prototype.updateRoomButtons = function () {
        var btn;
        btn = document.getElementById("newgamebtn");
        btn.disabled = !(this.isInLobby() && !this.isJoinedToRoom());
        var canJoin = this.isInLobby() && !this.isJoinedToRoom() && this.availableRooms().length > 0;
        btn = document.getElementById("joingamebtn");
        btn.disabled = !canJoin;
        var canJoinOrCreate = this.isInLobby() && !this.isJoinedToRoom();
        btn = document.getElementById("joinorcreategamebtn");
        btn.disabled = !canJoinOrCreate;
        btn = document.getElementById("joinrandomgamebtn");
        btn.disabled = !canJoinOrCreate;
        btn = document.getElementById("leavebtn");
        btn.disabled = !(this.isJoinedToRoom());
    };
    return DemoLoadBalancing;
}(Photon.LoadBalancing.LoadBalancingClient));
Photon.setOnLoad(function () {
    return window.onload = function () { return new DemoLoadBalancing().start(); };
});
