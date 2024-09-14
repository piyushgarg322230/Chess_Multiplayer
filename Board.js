const startBoard = (game, options = { playAgainst: 'human', aiColor: 'black', aiLevel: 'dumb' }) => {

    const aiPlayer = options.playAgainst === 'ai' ? ai(options.aiColor) : null;

    const board = document.getElementById('board');
    const squares = board.querySelectorAll('.square');
    const whiteSematary = document.getElementById('whiteSematary');
    const blackSematary = document.getElementById('blackSematary');
    const turnSign = document.getElementById('turn');
    let clickedPieceName;

    const resetSematary = () => {
        whiteSematary.querySelectorAll('div').forEach(div => div.innerHTML = '');
        blackSematary.querySelectorAll('div').forEach(div => div.innerHTML = '');
    }

    resetBtn.addEventListener("click", () => {
        document.getElementById('popupBack').style.display = 'flex';
    });

    exitBtn.addEventListener('click', () => {
        console.log('Exit button clicked');
        // this.resetGame();
   
        location.reload();

        // document.querySelectorAll('.scene').forEach(scene => scene.classList.add('show'));

        // document.getElementById('popupBack').style.display = 'none';

    });

    continueBtn.addEventListener('click', function () {
        console.log('Exit button clicked');
        document.getElementById('popupBack').style.display = 'none';
    });
    const resetBoard = () => {
        resetSematary();

        for (const square of squares) {
            square.innerHTML = '';
        }

        for (const piece of game.pieces) {
            const square = document.getElementById(piece.position);
            square.innerHTML = `<img class="piece ${piece.rank}" id="${piece.name}" src="img/${piece.color}-${piece.rank}.webp">`;
        }

        document.getElementById('endscene').classList.remove('show');
    }

    resetBoard();

    const setGameState = state => {
        gameState = state;
        // if (gameState === 'ai_thinking') {
        //     turnSign.innerHTML += ' (thinking...)';
        // }else if(gameState === 'NextPlayerTrun'){
        //     turnSign.innerHTML += ' (waiting...)';

        // }
    }

    const setAllowedSquares = (pieceImg) => {
        clickedPieceName = pieceImg.id;
        const allowedMoves = game.getPieceAllowedMoves(clickedPieceName);
        if (allowedMoves) {
            const clickedSquare = pieceImg.parentNode;
            clickedSquare.classList.add('clicked-square');

            allowedMoves.forEach(allowedMove => {
                if (document.contains(document.getElementById(allowedMove))) {
                    if (document.getElementById(allowedMove).querySelector('img')) {
                        console.log("Hello")
                    } else {
                        const dotePostion = document.createElement('div');
                        dotePostion.className = 'dotePostion'; // Set its ID
                        document.getElementById(allowedMove).appendChild(dotePostion);
                    }

                }
            });
        }
        else {
            clearSquares();
        }
    }

    const clearSquares = () => {
        board.querySelectorAll('.dotePostion').forEach(dote => dote.remove());
        const clickedSquare = document.getElementsByClassName('clicked-square')[0];
        if (clickedSquare) {
            clickedSquare.classList.remove('clicked-square');
        }
    }

    const setLastMoveSquares = (from, to) => {
        document.querySelectorAll('.last-move').forEach(lastMoveSquare => lastMoveSquare.classList.remove('last-move'));
        from.classList.add('last-move');
        to.classList.add('last-move');
    }

    function movePiece(square) {
        if (!gameState || gameState === 'ai_thinking' || gameState === 'NextPlayerTrun') {
            return;
        }

        const position = square.getAttribute('id');
        const existedPiece = game.getPieceByPos(position);

        if (existedPiece && existedPiece.color === game.turn) {
            const pieceImg = document.getElementById(existedPiece.name);
            clearSquares();
            return setAllowedSquares(pieceImg);
        }

        let play = game.movePiece(clickedPieceName, position);
        if (clickedPieceName && clickedPieceName.includes("white")
            && play && photonClient.isPhotonConnected) {
            var picse = clickedPieceName.replace("white", "black");
            const pos = chessBoxs["" + position];
            const blackpos = chessBoxsPos[pos];
            var data = {
                "clickedPieceName": picse,
                "position": blackpos,
                "pos": pos,
                "Wposition": position
            }

            setGameState("NextPlayerTrun")
            if (!photonClient.isComputer) {
                photonClient.sendMessageToRoom(EVENT_PLAYERMOVE_CODE, data);
            }
        }


    }

    squares.forEach(square => {
        square.addEventListener("click", function () {
            movePiece(this);
        });
        square.addEventListener("dragover", function (event) {
            event.preventDefault();
        });
        square.addEventListener("drop", function () {
            movePiece(this);
        });
    });

    game.pieces.forEach(piece => {
        const pieceImg = document.getElementById(piece.name);
        pieceImg.addEventListener("drop", function () {
            const square = document.getElementById(piece.position);
            movePiece(square);
        });
    });

    document.querySelectorAll('img.piece').forEach(pieceImg => {
        pieceImg.addEventListener("dragstart", function (event) {
            if (gameState === 'ai_thinking' || gameState === 'NextPlayerTrun') {
                return;
            }
            event.stopPropagation();
            event.dataTransfer.setData("text", event.target.id);
            clearSquares();
            setAllowedSquares(event.target)
        });
        pieceImg.addEventListener("drop", function (event) {
            if (gameState === 'ai_thinking' || gameState === 'NextPlayerTrun') {
                return;
            }
            event.stopPropagation();
            clearSquares();
            setAllowedSquares(event.target)
        });
    });

    const startTurn = turn => {
        gameState = turn + '_turn';
        // turnSign.innerHTML = turn === 'white' ? "White's Turn" : "Black's Turn";
        if (turn === 'white') {
            document.getElementById("box1").style.display = "flex";
            document.getElementById("box1").style.backgroundColor = "rgb(0, 179, 0)";
            document.getElementById("box2").style.display = "none";
        } else {
            document.getElementById("box2").style.display = "flex";
            document.getElementById("box2").style.backgroundColor = "rgb(0, 179, 0)";
            document.getElementById("box1").style.display = "none";

        }

        if (gameState !== 'checkmate' && options.playAgainst === 'ai' && turn === options.aiColor) {
            setGameState('ai_thinking');
            aiPlayer.play(game.pieces, aiPlay => {
                setTimeout(() => {
                    setGameState('human_turn');
                    game.movePiece(aiPlay.move.pieceName, aiPlay.move.position);
                }, 1000);
            });
        }
    }

    game.on('pieceMove', move => {
        const from = document.getElementById(move.from);
        const to = document.getElementById(move.piece.position);
        to.append(document.getElementById(move.piece.name));
        clearSquares();

        setLastMoveSquares(from, to);
    });

    game.on('turnChange', startTurn);
    photonClient.setChangeTurn(startTurn, setGameState);


    if (photonClient.isCreated) {
        photonClient.setFirstTrun();
    }
    game.on('promotion', queen => {
        const square = document.getElementById(queen.position);
        square.innerHTML = `<img class="piece queen" id="${queen.name}" src="img/${queen.color}-queen.webp">`;
    })

    game.on('kill', piece => {
        const pieceImg = document.getElementById(piece.name);
        pieceImg.parentNode.removeChild(pieceImg);
        pieceImg.className = '';

        const sematary = piece.color === 'white' ? whiteSematary : blackSematary;
        sematary.querySelector('.' + piece.rank).append(pieceImg);
    });

    game.on('checkMate', color => {
        const endScene = document.getElementById('endscene');
        endScene.getElementsByClassName('winning-sign')[0].innerHTML = color + ' Wins';
        endScene.classList.add('show');
        setGameState('checkmate');
        if (color === "white") showPopUp("Win");
        else showPopUp("Loss");
    });


    if (options.playAgainst === 'ai') {
        startTurn('white');
    }



}

const chessBoxs = {
    "11": "R1C1", "12": "R1C2", "13": "R1C3", "14": "R1C4", "15": "R1C5", "16": "R1C6", "17": "R1C7", "18": "R1C8",
    "21": "R2C1", "22": "R2C2", "23": "R2C3", "24": "R2C4", "25": "R2C5", "26": "R2C6", "27": "R2C7", "28": "R2C8",
    "31": "R3C1", "32": "R3C2", "33": "R3C3", "34": "R3C4", "35": "R3C5", "36": "R3C6", "37": "R3C7", "38": "R3C8",
    "41": "R4C1", "42": "R4C2", "43": "R4C3", "44": "R4C4", "45": "R4C5", "46": "R4C6", "47": "R4C7", "48": "R4C8",
    "51": "R5C1", "52": "R5C2", "53": "R5C3", "54": "R5C4", "55": "R5C5", "56": "R5C6", "57": "R5C7", "58": "R5C8",
    "61": "R6C1", "62": "R6C2", "63": "R6C3", "64": "R6C4", "65": "R6C5", "66": "R6C6", "67": "R6C7", "68": "R6C8",
    "71": "R7C1", "72": "R7C2", "73": "R7C3", "74": "R7C4", "75": "R7C5", "76": "R7C6", "77": "R7C7", "78": "R7C8",
    "81": "R8C1", "82": "R8C2", "83": "R8C3", "84": "R8C4", "85": "R8C5", "86": "R8C6", "87": "R8C7", "88": "R8C8"
};
const chessBoxsPos =
{
    "R1C1": "81", "R1C2": "82", "R1C3": "83", "R1C4": "84", "R1C5": "85", "R1C6": "86", "R1C7": "87", "R1C8": "88",
    "R2C1": "71", "R2C2": "72", "R2C3": "73", "R2C4": "74", "R2C5": "75", "R2C6": "76", "R2C7": "77", "R2C8": "78",
    "R3C1": "61", "R3C2": "62", "R3C3": "63", "R3C4": "64", "R3C5": "65", "R3C6": "66", "R3C7": "67", "R3C8": "68",
    "R4C1": "51", "R4C2": "52", "R4C3": "53", "R4C4": "54", "R4C5": "55", "R4C6": "56", "R4C7": "57", "R4C8": "58",
    "R5C1": "41", "R5C2": "42", "R5C3": "43", "R5C4": "44", "R5C5": "45", "R5C6": "46", "  ": "47", "R5C8": "48",
    "R6C1": "31", "R6C2": "32", "R6C3": "33", "R6C4": "34", "R6C5": "35", "R6C6": "36", "R6C7": "37", "R6C8": "38",
    "R7C1": "21", "R7C2": "22", "R7C3": "23", "R7C4": "24", "R7C5": "25", "R7C6": "26", "R7C7": "27", "R7C8": "28",
    "R8C1": "11", "R8C2": "12", "R8C3": "13", "R8C4": "14", "R8C5": "15", "R8C6": "16", "R8C7": "17", "R8C8": "18"
}


const pieces = [
    { rank: 'knight', position: 12, color: 'white', name: 'whiteKnight1' },
    { rank: 'knight', position: 17, color: 'white', name: 'whiteKnight2' },
    { rank: 'queen', position: 14, color: 'white', name: 'whiteQueen' },
    { rank: 'bishop', position: 13, color: 'white', name: 'whiteBishop1' },
    { rank: 'bishop', position: 16, color: 'white', name: 'whiteBishop2' },
    { rank: 'pawn', position: 24, color: 'white', name: 'whitePawn4' },
    { rank: 'pawn', position: 25, color: 'white', name: 'whitePawn5' },
    { rank: 'pawn', position: 26, color: 'white', name: 'whitePawn6' },
    { rank: 'pawn', position: 21, color: 'white', name: 'whitePawn1' },
    { rank: 'pawn', position: 22, color: 'white', name: 'whitePawn2' },
    { rank: 'pawn', position: 23, color: 'white', name: 'whitePawn3' },
    { rank: 'pawn', position: 27, color: 'white', name: 'whitePawn7' },
    { rank: 'pawn', position: 28, color: 'white', name: 'whitePawn8' },
    { rank: 'rook', position: 11, color: 'white', name: 'whiteRook1', ableToCastle: true },
    { rank: 'rook', position: 18, color: 'white', name: 'whiteRook2', ableToCastle: true },
    { rank: 'king', position: 15, color: 'white', name: 'whiteKing', ableToCastle: true },

    { rank: 'knight', position: 82, color: 'black', name: 'blackKnight1' },
    { rank: 'knight', position: 87, color: 'black', name: 'blackKnight2' },
    { rank: 'queen', position: 84, color: 'black', name: 'blackQueen' },
    { rank: 'bishop', position: 83, color: 'black', name: 'blackBishop1' },
    { rank: 'bishop', position: 86, color: 'black', name: 'blackBishop2' },
    { rank: 'pawn', position: 74, color: 'black', name: 'blackPawn4' },
    { rank: 'pawn', position: 75, color: 'black', name: 'blackPawn5' },
    { rank: 'pawn', position: 76, color: 'black', name: 'blackPawn6' },
    { rank: 'pawn', position: 71, color: 'black', name: 'blackPawn1' },
    { rank: 'pawn', position: 72, color: 'black', name: 'blackPawn2' },
    { rank: 'pawn', position: 73, color: 'black', name: 'blackPawn3' },
    { rank: 'pawn', position: 77, color: 'black', name: 'blackPawn7' },
    { rank: 'pawn', position: 78, color: 'black', name: 'blackPawn8' },
    { rank: 'rook', position: 81, color: 'black', name: 'blackRook1', ableToCastle: true },
    { rank: 'rook', position: 88, color: 'black', name: 'blackRook2', ableToCastle: true },
    { rank: 'king', position: 85, color: 'black', name: 'blackKing', ableToCastle: true },
];


const game = new Game(pieces, 'white');

const startNewGame = () => {
    const playAgainst = document.querySelector('input[name="oponent"]:checked').value;
    document.querySelectorAll('.scene').forEach(scene => scene.classList.remove('show'));


    if (playAgainst === "ai") {
        
        const humanColor = document.querySelector('input[name="human_color"]:checked')?.value;
        const aiColor = humanColor === 'white' ? 'black' : 'white';
        const aiLevel = 'dumb';
        startBoard(game, { playAgainst, aiColor, aiLevel });

    } else {
        startLoading();
        photonClient.joinRoomFromList();

    }
    // showPopUp("Win")

    document.getElementById('resetBtn').style.display = 'flex';

}




const showPopUp = (status) => {
    document.getElementById('popup').style.display = 'flex'

    const popup = document.getElementById('popup');
    const pElement = popup.querySelector('p');
    if (status == "Win") {
        pElement.textContent = "You Win!"
    } else {
        pElement.textContent = "You Loss!"

    }
    photonClient.callOnMatchEnd(status);
    const gameStart = document.getElementById('closeBtn');
    gameStart.addEventListener('click', () => {
        document.getElementById('popup').style.display = 'none';
        location.reload();
    });


}

const startLoading = () => document.getElementById('loader-container').style.display = 'flex';
const stopLoading = () => document.getElementById('loader-container').style.display = 'none';
const showColorSelect = () => document.querySelector('.select-color-container').classList.add('show');
const hideColorSelect = () => document.querySelector('.select-color-container').classList.remove('show');