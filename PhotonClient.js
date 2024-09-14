class PhotonClient {
    client;
    isConnected = false;
    isLobbyJoined = false;
    waitCount=0;
    count = 0;
    photonId;
    changeTurn;
    setGameState;
    isCreated=false;
    isPhotonConnected = false;
    setPhoton(photonNet) {
        this.photonId=photonNet;
        this.client = new Photon.LoadBalancing.LoadBalancingClient(
            Photon.ConnectionProtocol.Wss,
            photonNet.appId,
            photonNet.version
        );

        // Assign the class function to the client's events
        this.client.onStateChange = this.onStateChange.bind(this);
        this.client.onActorLeave = this.ActorLeave.bind(this);
        this.client.onJoinRoom = this.onJoinRoom.bind(this);
        this.client.onPlayerEnteredRoom = this.onPlayerEnteredRoom.bind(this);
        this.client.onEvent = this.onEvent.bind(this);

        // Optionally, you can initiate the connection to Photon here
        this.client.connectToRegionMaster(photonNet.region);
    }

    // photon call callback function
    onStateChange = (state) => {
        console.log("State:", state);
        switch (state) {
            case Photon.LoadBalancing.LoadBalancingClient.State.JoinedLobby:
                console.log("Joined the lobby, waiting for room list...");
                this.isLobbyJoined = true;
                this.isConnected = true;
                break;

            case Photon.LoadBalancing.LoadBalancingClient.State.ConnectingToNameServer:
                console.log("Connecting to the Photon NameServer...");
                break;

            case Photon.LoadBalancing.LoadBalancingClient.State.Disconnected:
                console.log("Disconnected from Photon.");
                this.isConnected = false;
                this.isLobbyJoined = false;
                break;

            case Photon.LoadBalancing.LoadBalancingClient.State.ConnectedToNameServer:
                console.log("Connected to the Photon NameServer.");
                break;

            case Photon.LoadBalancing.LoadBalancingClient.State.ConnectedToMaster:
                console.log("Connected to the Photon Master Server.");
                break;

            case Photon.LoadBalancing.LoadBalancingClient.State.Joined:
                console.log("Joined a room on Photon.");
                break;

            case Photon.LoadBalancing.LoadBalancingClient.State.Error:
                console.log("An error occurred with Photon.");
                break;

            default:
                console.log("Unhandled state:", state);
                break;
        }
    };
    onJoinRoom = function () {
        console.log("Joined random room:", this.client.myRoom().name);
        if (!this.isCreated){
            setTimeout(() => {
                this.startGame(false);
            }, 2000);
        }
    };
    onPlayerEnteredRoom = (player) => {
        console.log("A new player has entered the room:", player.name);
        if (this.waitingForPlayer) {
            this.waitingForPlayer = false;
            console.log(`Player ${newPlayer.getName()} joined the room. Stopping the wait.`);
            // start game hare
            this.startGame(false);
        }
    }
    onEvent = (code, roll, actorNr) => {
        console.log("Event received: ", code, roll, actorNr);
        const data  = roll.text;
        if (code == EVENT_PLAYERMOVE_CODE) {
            // update Player poss
            const pieceImg=document.getElementById(data.clickedPieceName);
            const allowedMoves = game.getPieceAllowedMoves(data.clickedPieceName);
            if (allowedMoves) {
                // const clickedSquare = pieceImg.parentNode;
                // clickedSquare.classList.add('clicked-square');
    
                // allowedMoves.forEach( allowedMove => {
                //     if (document.contains(document.getElementById(allowedMove))) {
                //         document.getElementById(allowedMove).classList.add('allowed');
                //     }
                // });
            }
            game.movePiece(data.clickedPieceName, data.position);

        } else if (code == EVENT_FIRSTMOVE_CODE) {

            if(this.changeTurn){
                this.changeTurn( "black");
                game.turn = "black";
                this.setGameState("NextPlayerTrun")
            }else{
                console.log("Something went worng!");
                setTimeout(() => {
                    this.onEvent(code,roll,actorNr);
                }, 500);
            }

        } else if (code == EVENT_LEAVE_CODE) {

        }
    };
    ActorLeave = (M, N) => {
        //show alert or popup for leave room or end game what u want like this
        if (M.actorNr != this.client._myActor.actorNr && !this.isILeave) {
            console.log("onActorLeave  " + M + "   " + N);
            showPopUp("Win");
            this.client.leaveRoom();
            this.callOnRoomLeave();
            //this.showPopUp("WHITE");
        }
    };


    // manageing game and room join waiting function
    joinRoomFromList = () => {

        if (this.client && this.client.isConnectedToMaster() && this.client.isInLobby()) {
            var roomlist = this.client.availableRooms();

            if (roomlist.length > 0) {

                for (let i = roomlist.length - 1; i >= 0; i--) {
                    let room = roomlist[i];
                    console.log("Room name:", room.name, "Players:", room.playerCount, "/", room.maxPlayers);
                    console.log(`Room found: ${room.name}, Open: ${room.isOpen}, Players: ${room.playerCount}/${room.maxPlayers}`);
                    if (room.isOpen && room.playerCount < 2
                        && room.playerCount != 0 && room.playerCount == 1) {
                        console.log(`Joining room: ${room.name}`);
                        this.isCreated = false;
                        this.client.joinRoom(room.name);
                        return;
                    }
                }

            }

            console.log("No joinable rooms found. Creating a new room...");
            this.createNewRoom();
        } else {
            if (this.client && this.client.isConnectedToMaster() && this.client.isInLobby()) {
                this.count++;
                setTimeout(() => {
                    if (this.count > 3) {
                        this.count = 0;
                        this.startGame(true);
                    } else {
                        this.joinRoomFromList();
                    }
                }, 2000);
            } else {
                this.setPhoton(this.photonId);
                setTimeout(() => {
                    this.joinRoomFromList()
                }, 5000);
            }

        }

    }
    createNewRoom = () => {
        const roomName = "Room_" + Math.floor(Math.random() * 8999 + 1000);
        const roomOptions = {
            maxPlayers: 2,
            isVisible: true,
            isOpen: true,
            emptyRoomLiveTime: 100, // 5 seconds to keep the room after the last player leaves
            playerTtl: 0 // Player is removed immediately after disconnection
        };

        this.isCreated=true;
        console.log(`Creating room: ${roomName}`);
        this.client.createRoom(roomName, roomOptions);
        this.waitingForPlayer = true;

        this.waitForPlayerToJoin();
    }
    waitForPlayerToJoin = () => {
        this.waitCount++;
        console.log("Waiting for another player to join...");
        setTimeout(() => {

            if (this.waitingForPlayer && this.client.myRoom() && (this.client.myRoom().playerCount === 1 || this.client.myRoom().playerCount === 0)) {
                if (this.waitCount < 20) {
                    this.waitForPlayerToJoin();
                    return;
                }
                console.log("No other player joined. Closing and hiding the room.");
                this.waitCount = 0;
                this.client.myRoom().isVisible = false;
                this.client.myRoom().isOpen = false;
                this.client.leaveRoom();
                this.isILeave = true;
                // Redirect to offline mode or handle as necessary
                var isComputer = true;
                this.startGame(isComputer);

            } else {
                // start Game here
                var isComputer = false;
                this.startGame(isComputer);

            }
        }, 2000);
    }
    sendMessageToRoom = (eventCode, message) => {
        this.client.raiseEvent(eventCode, { text: message });
        console.log("Message sent to room:", message);
    }

    startGame(isComputer){
        document.querySelectorAll('.scene').forEach( scene => scene.classList.remove('show') );
        const humanColor = document.querySelector('input[name="human_color"]:checked')?.value;
        const aiColor = humanColor === 'white' ? 'black' : 'white';
        const aiLevel = 'dumb';
        stopLoading();
        if(isComputer){
            startBoard(game, {playAgainst:"ai", aiColor, aiLevel});
        }else{
            this.isPhotonConnected = true;
            startBoard(game, {playAgainst:"human", aiColor, aiLevel});
        }
        this.callStartApi(isComputer);
    }
    setChangeTurn(startTurn,setGameState){
        this.changeTurn = startTurn;
        this.setGameState =setGameState;
    }
    setFirstTrun(){
        this.sendMessageToRoom(EVENT_FIRSTMOVE_CODE, "I_AM_FIRST");

        if(this.changeTurn){
            this.changeTurn( "white");
            this.setGameState("human_turn")

        }else{
            console.log("Something went worng!");
            
        }
    }

    callStartApi(isComputer) {
        var room = this.client.myRoom();
        var userList = this.client.myRoomActors()
        var otherPlayerId = "";
        for (let index = 0; index < Object.keys(userList).length; index++) {
            const element = userList[Object.keys(userList)[index]];
            if (element.userId != this.client._myActor.userId) {
                otherPlayerId = element.userId;
            }

        }
        var data = {
            roomId: room.name,
            Player1Id: this.client._myActor.userId,
            Player2Id: otherPlayerId,
            isHostUser:this.isCreated,
            isBot:isComputer,
        }

        if(isComputer){
            data.isHostUser  =true;
        }
        ApiClient.callMatchStartApi(data, (res) => {
            console.log(res);
        });
        localStorage.setItem('hasPlayed', 'true');

    }

    callOnMatchEnd(win) {
        let data =
        {
            "token": "secret",
            "event_type": "match_ended",
            "message": "m",
            "data": {
                "event_type": "match_ended",
                "datetime": new Date().getTime(),
                "winner": win,
                "player1Score": "number?",
                "player2Score": "number?"
            }
        }
        ApiClient.callMatchEndRiderectApi(data, (res) => {
            console.log(res);
        });
    }
    callOnRoomLeave(){
        let data = {
            "token": "secret", // from query parameter
            "event_type": "match_aborted",
            "message": "string", // human-readable text explaining the event
            "data": {
                   "datetime":  new Date().getTime(), // date and time in ISO format
                   "event_type": "match_aborted",
                   "error_code": "101", // error code related to the game for troubleshooting
                   "error_description": "string" // error message or stringified error object
            }
        }
        ApiClient.callMatchEndRiderectApi(data, (res) => {
            console.log(res);
        });
    }
}

const photonClient = new PhotonClient();
photonClient.setPhoton({
    appId: "f67efe8a-4904-4a31-8913-648a4b6f000d"
    , region: "eu",
    version: "1.0"
});



const EVENT_PLAYERMOVE_CODE = 101;
const EVENT_FIRSTMOVE_CODE = 102;
const EVENT_LEAVE_CODE = 101;