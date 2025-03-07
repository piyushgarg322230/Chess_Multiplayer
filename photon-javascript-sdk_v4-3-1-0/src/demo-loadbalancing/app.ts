/// <reference path="Photon/photon.d.ts"/>

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

class DemoLoadBalancing extends Photon.LoadBalancing.LoadBalancingClient {
    logger = new Photon.Logger("Demo:");

    private USERCOLORS = ["#FF0000", "#00AA00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF"];

    constructor() {
        super(DemoWss ? Photon.ConnectionProtocol.Wss : Photon.ConnectionProtocol.Ws, DemoAppId, DemoAppVersion);

        this.logger.info("Photon Version: " + Photon.Version + (Photon.IsEmscriptenBuild ? "-em" : ""));

        // uncomment to use Custom Authentication
        // this.setCustomAuthentication("username=" + "yes" + "&token=" + "yes");

        this.output(this.logger.format("Init", this.getNameServerAddress(), DemoAppId, DemoAppVersion));
        this.logger.info("Init", this.getNameServerAddress(), DemoAppId, DemoAppVersion);
        this.setLogLevel(Photon.LogLevel.INFO);

        this.myActor().setCustomProperty("color", this.USERCOLORS[0]);
    }
    start() {
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
    }
    onError(errorCode: number, errorMsg: string) {
        this.output("Error " + errorCode + ": " + errorMsg);
    }
    onEvent(code: number, content: any, actorNr: number) {
        switch(code) {
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
    }

    onStateChange(state: number) {
        // "namespace" import for static members shorter acceess
        var LBC = Photon.LoadBalancing.LoadBalancingClient;

        var stateText = document.getElementById("statetxt");
        stateText.textContent = LBC.StateToName(state);
        this.updateRoomButtons();
        this.updateRoomInfo();
    }
    objToStr(x: {}) {
        var res = "";
        for (var i in x) {
            res += (res == "" ? "" : " ,") + i + "=" + x[i];
        }
        return res;
    }
    updateRoomInfo() {
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
    }

    onActorPropertiesChange(actor: Photon.LoadBalancing.Actor) {
        this.updateRoomInfo();
    }

    onMyRoomPropertiesChange() {
        this.updateRoomInfo();
    }

    onRoomListUpdate(rooms: Photon.LoadBalancing.Room[], roomsUpdated: Photon.LoadBalancing.Room[], roomsAdded: Photon.LoadBalancing.Room[], roomsRemoved: Photon.LoadBalancing.Room[]) {
        this.logger.info("Demo: onRoomListUpdate", rooms, roomsUpdated, roomsAdded, roomsRemoved);
        this.output("Demo: Rooms update: " + roomsUpdated.length + " updated, " + roomsAdded.length + " added, " + roomsRemoved.length + " removed");
        this.onRoomList(rooms);
        this.updateRoomButtons(); // join btn state can be changed
    }

    onRoomList(rooms: Photon.LoadBalancing.Room[]) {
        var menu = document.getElementById("gamelist");
        while (menu.firstChild) {
            menu.removeChild(menu.firstChild);
        }
        var selectedIndex = 0;
        for (var i = 0; i < rooms.length;++i) {
            var r = rooms[i];
            var item = document.createElement("option");
            item.attributes["value"] = r.name;
            item.textContent = r.name;
            menu.appendChild(item);
            if (this.myRoom().name == r.name) {
                selectedIndex = i;
            }
        }
        (<HTMLSelectElement>menu).selectedIndex = selectedIndex;
        this.output("Demo: Rooms total: " + rooms.length);
        this.updateRoomButtons();
    }
    onJoinRoom() {
        this.output("Game " + this.myRoom().name + " joined");
        this.updateRoomInfo()
    }
    onActorJoin(actor: Photon.LoadBalancing.Actor) {
        this.output("actor " + actor.actorNr + " joined");
        this.updateRoomInfo()
    }
    onActorLeave(actor: Photon.LoadBalancing.Actor) {
        this.output("actor " + actor.actorNr + " left");
        this.updateRoomInfo()
    }
    sendMessage(message: string) {
        try {
            this.raiseEvent(1, { message: message, senderName: "user" + this.myActor().actorNr });
            this.output('me[' + this.myActor().actorNr + ']: ' + message, this.myActor().getCustomProperty("color"));
        }
        catch (err) {
            this.output("error: " + err.message);
        }
    }

    setupUI() {
        this.logger.info("Setting up UI.");

        var input = <HTMLInputElement>document.getElementById("input");
        input.value = 'hello';
        input.focus();

        var btnJoin = <HTMLButtonElement>document.getElementById("joingamebtn");
        btnJoin.onclick = (ev) => {
            if (this.isInLobby()) {
                var menu = <HTMLSelectElement>document.getElementById("gamelist");
                var gameId = menu.children[menu.selectedIndex].textContent;
                var expectedUsers = <HTMLInputElement>document.getElementById("expectedusers");
                this.output(gameId);
                this.joinRoom(gameId, { expectedUsers: expectedUsers.value.length > 0 ? expectedUsers.value.split(",") : undefined });
            }
            else {
                this.output("Reload page to connect to Master");
            }
            return false;
        }

        var btnJoinOrCreate = <HTMLButtonElement>document.getElementById("joinorcreategamebtn");
        btnJoinOrCreate.onclick = (ev) => {
            if (this.isInLobby()) {
                var gameId = <HTMLInputElement>document.getElementById("newgamename");
                var expectedUsers = <HTMLInputElement>document.getElementById("expectedusers");
                this.output(gameId.value);
                this.joinRoom(gameId.value.length > 0 ? gameId.value : undefined, { createIfNotExists: true, expectedUsers: expectedUsers.value.length > 0 ? expectedUsers.value.split(",") : undefined },
                    { roomTTL: 20000, playerTTL: 20000, maxPlayers: 6 }
                );
                //this.joinRoom(gameId.value.length > 0 ? gameId.value : undefined, { createIfNotExists: true });
            }
            else {
                this.output("Reload page to connect to Master");
            }
            return false;
        }

        var btnJoinRandom = <HTMLButtonElement>document.getElementById("joinrandomgamebtn");
        btnJoinRandom.onclick = (ev) => {
            if (this.isInLobby()) {
                this.output("Random Game or Create...");
                var name = <HTMLInputElement>document.getElementById("newgamename");
                var expectedUsers = <HTMLInputElement>document.getElementById("expectedusers");
                this.joinRandomOrCreateRoom({ expectedMaxPlayers: 5, expectedUsers: expectedUsers.value.length > 0 ? expectedUsers.value.split(",") : undefined },
                    name.value.length > 0 ? name.value : undefined,
                    { roomTTL: 20000, playerTTL: 20000, maxPlayers: 6 });
            }
            else {
                this.output("Reload page to connect to Master");
            }
            return false;
        }

        var btnNew = <HTMLButtonElement>document.getElementById("newgamebtn");
        btnNew.onclick = (ev) => {
            if (this.isInLobby()) {
                var name = <HTMLInputElement>document.getElementById("newgamename");
                this.output("New Game");
                var expectedUsers = <HTMLInputElement>document.getElementById("expectedusers");
                //this.createRoom(name.value.length > 0 ? name.value : undefined, { isOpen: true, isVisible: true, roomTTL: 20000, playerTTL: 20000, expectedUsers: expectedUsers.value.length > 0 ? expectedUsers.value.split(",") : undefined, maxPlayers: 6, propsListedInLobby: ["p1", "p2"], customGameProperties: { "_n": 1, "_n2": "n2 val", "_n3": true } });
                this.createRoom(name.value.length > 0 ? name.value : undefined);
            }
            else {
                this.output("Reload page to connect to Master");
            }
            return false;
        }

        var btnSetExpectedUsers = <HTMLButtonElement>document.getElementById("setexpectedusers");
        btnSetExpectedUsers.onclick = (ev) => {
            this.myRoom().setExpectedUsers((<HTMLInputElement>document.getElementById("expectedusers")).value.split(","));
        }

        var btnClearExpectedUsers = <HTMLButtonElement>document.getElementById("clearexpectedusers");
        btnClearExpectedUsers.onclick = (ev) => {
            this.myRoom().clearExpectedUsers();
        }

        var form = <HTMLFormElement>document.getElementById("mainfrm");
        form.onsubmit = () => {
            if (this.isJoinedToRoom()) {
                var input = <HTMLInputElement>document.getElementById("input");

                this.sendMessage(input.value);
                input.value = '';
                input.focus();
            }
            else {
                if (this.isInLobby()) {
                    this.output("Press Join or New Game to connect to Game");
                }
                else {
                    this.output("Reload page to connect to Master");
                }
            }
            return false;
        }

        var btn = <HTMLButtonElement>document.getElementById("leavebtn");
        btn.onclick = (ev) => {
            this.leaveRoom();
            return false;
        }

        (<HTMLButtonElement>document.getElementById("disconnectbtn")).onclick = (ev) => this.disconnect();
        (<HTMLButtonElement>document.getElementById("remasterbtn")).onclick = (ev) => this.reconnectToMaster();
        (<HTMLButtonElement>document.getElementById("regamebtn")).onclick = (ev) => this.reconnectAndRejoin();

        btn = <HTMLButtonElement>document.getElementById("colorbtn");
        btn.onclick = (ev) => {
            var ind = Math.floor(Math.random() * this.USERCOLORS.length);
            var color:String = this.USERCOLORS[ind];

            this.myActor().setCustomProperty("color", color);

            this.sendMessage( "... changed his / her color!");
        }

        btn = <HTMLButtonElement>document.getElementById("testbtn");
        btn.onclick = (ev) => {
            this.myRoom().setMaxPlayers((this.myRoom().maxPlayers || this.myRoomActorsArray().length) + 1);
            this.myRoom().setIsVisible(!this.myRoom().isVisible);
            this.myRoom().setIsOpen(!this.myRoom().isOpen);
            this.myRoom().setRoomTTL(this.myRoom().roomTTL + 1000);
            this.myRoom().setPlayerTTL(this.myRoom().playerTTL + 2000);
            this.myRoom().setExpectedUsers((this.myRoom().expectedUsers || []).concat("u" + (this.myRoom().expectedUsers || []).length));
            this.myRoom().setPropsListedInLobby((this.myRoom().getPropsListedInLobby() || []).concat("l"));
            this.myRoom().setMasterClient(this.myRoomActorsArray()[Math.floor(Math.random() * this.myRoomActorsArray().length)].actorNr);

            this.myActor().setName(this.myActor().name + " ! ");

            var n, p, n1, n2, p1, p2, prop, expected;
            var setPropTest = function (actorOrRoom: any) {
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
            }

            setPropTest(this.myActor());
            this.myActor().setCustomProperty(n, (p || "p") + (p || "").length, true, p);
            this.myActor().setCustomProperties(prop, true, expected);

            setPropTest(this.myRoom());
            this.myRoom().setCustomProperty(n, (p || "p") + (p || "").length, true, p);
            this.myRoom().setCustomProperties(prop, true, expected);

            this.sendMessage("... test: " + this.myRoom().maxPlayers);
        }

        this.updateRoomButtons();
    }

    output(str: string, color?: string) {
        var log = document.getElementById("theDialogue");
        var escaped = str.replace(/&/, "&amp;").replace(/</, "&lt;").
        replace(/>/, "&gt;").replace(/"/, "&quot;");
        if (color) {
            escaped = "<FONT COLOR='" + color + "'>" + escaped + "</FONT>";
        }
        log.innerHTML = log.innerHTML + escaped + "<br>";
        log.scrollTop = log.scrollHeight;
    }

    private updateRoomButtons() {
        var btn;
        btn = <HTMLButtonElement>document.getElementById("newgamebtn");
        btn.disabled = !(this.isInLobby() && !this.isJoinedToRoom() );

        var canJoin = this.isInLobby() && !this.isJoinedToRoom() && this.availableRooms().length > 0;
        btn = <HTMLButtonElement>document.getElementById("joingamebtn");
        btn.disabled = !canJoin;
        var canJoinOrCreate = this.isInLobby() && !this.isJoinedToRoom();
        btn = <HTMLButtonElement>document.getElementById("joinorcreategamebtn");
        btn.disabled = !canJoinOrCreate;
        btn = <HTMLButtonElement>document.getElementById("joinrandomgamebtn");
        btn.disabled = !canJoinOrCreate;
        btn = <HTMLButtonElement>document.getElementById("leavebtn");
        btn.disabled = !( this.isJoinedToRoom() );
    }
}

Photon.setOnLoad(() =>
    window.onload = () => new DemoLoadBalancing().start()
);
