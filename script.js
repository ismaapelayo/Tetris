const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const grid = 30;
const tetrominoSequence = [];

const tetrominos = [
    // I
    [
        [1, 1, 1, 1]
    ],
    // J
    [
        [1, 0, 0],
        [1, 1, 1]
    ],
    // L
    [
        [0, 0, 1],
        [1, 1, 1]
    ],
    // O
    [
        [1, 1],
        [1, 1]
    ],
    // S
    [
        [0, 1, 1],
        [1, 1, 0]
    ],
    // T
    [
        [0, 1, 0],
        [1, 1, 1]
    ],
    // Z
    [
        [1, 1, 0],
        [0, 1, 1]
    ]
];

const colors = [
    'cyan',
    'blue',
    'orange',
    'yellow',
    'green',
    'purple',
    'red'
];

const playfield = [];

for (let row = -2; row < 20; row++) {
    playfield[row] = [];
    for (let col = 0; col < 10; col++) {
        playfield[row][col] = 0;
    }
}

let tetromino = getNextTetromino();
let count = 0;
let rAF = null;
let gameOver = false;
let score = 0;

// Variables para el control táctil
let touchStartX = 0;
let touchEndX = 0;

// Funciones de control táctil
function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
}

function handleTouchMove(event) {
    touchEndX = event.touches[0].clientX;
}

function handleTouchEnd(event) {
    const swipeLength = touchEndX - touchStartX;
    if (Math.abs(swipeLength) > 50) {
        if (swipeLength > 0) {
            // Deslizar hacia la derecha
            moveTetrominoRight();
        } else {
            // Deslizar hacia la izquierda
            moveTetrominoLeft();
        }
    } else {
        // Deslizar hacia abajo
        moveTetrominoDown();
    }
}

function getNextTetromino() {
    if (tetrominoSequence.length === 0) {
        const sequence = [...Array(tetrominos.length).keys()];
        while (sequence.length) {
            const rand = Math.floor(Math.random() * sequence.length);
            tetrominoSequence.push(sequence.splice(rand, 1)[0]);
        }
    }
    const name = tetrominoSequence.pop();
    const matrix = tetrominos[name];

    return {
        name: name,
        matrix: matrix,
        row: 0,
        col: Math.floor((10 - matrix[0].length) / 2)
    };
}

function rotate(matrix) {
    const result = [];
    for (let i = 0; i < matrix[0].length; i++) {
        result[i] = [];
        for (let j = 0; j < matrix.length; j++) {
            result[i][j] = matrix[matrix.length - 1 - j][i];
        }
    }
    return result;
}

function isValidMove(matrix, cellRow, cellCol) {
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] && (
                cellCol + col < 0 ||
                cellCol + col >= playfield[0].length ||
                cellRow + row >= playfield.length ||
                playfield[cellRow + row][cellCol + col])
            ) {
                return false;
            }
        }
    }
    return true;
}

function placeTetromino() {
    let clearedLines = 0;
    for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col]) {
                // Si alguna parte del tetromino está fuera del campo de juego, el juego termina
                if (tetromino.row + row < 0) {
                    showGameOver();
                    return;
                }
                playfield[tetromino.row + row][tetromino.col + col] = tetromino.name + 1;
            }
        }
    }

    for (let row = playfield.length - 1; row >= 0;) {
        if (playfield[row].every(cell => cell !== 0)) {
            clearedLines++;
            for (let r = row; r >= 0; r--) {
                for (let c = 0; c < playfield[r].length; c++) {
                    playfield[r][c] = playfield[r - 1][c];
                }
            }
        } else {
            row--;
        }
    }

    // Aumentar la puntuación según las líneas eliminadas
    if (clearedLines > 0) {
        score += clearedLines * 100; // Cada línea vale 100 puntos
        updateScore();
    }

    tetromino = getNextTetromino();

    // Revisar si alguna pieza toca el borde
    for (let col = 0; col < playfield[0].length; col++) {
        if (playfield[0][col] !== 0) {
            showGameOver();
            return;
        }
    }
}

function showGameOver() {
    cancelAnimationFrame(rAF);
    gameOver = true;
    const gameOverElement = document.getElementById('gameOver');
    gameOverElement.style.display = 'block';
}

function updateScore() {
    document.getElementById('score').innerText = score;
}

function moveTetrominoLeft() {
    if (isValidMove(tetromino.matrix, tetromino.row, tetromino.col - 1)) {
        tetromino.col--;
    }
}

function moveTetrominoRight() {
    if (isValidMove(tetromino.matrix, tetromino.row, tetromino.col + 1)) {
        tetromino.col++;
    }
}

function moveTetrominoDown() {
    if (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
        tetromino.row++;
        count = 0;
    }
}

function rotateTetromino() {
    const rotatedMatrix = rotate(tetromino.matrix);
    if (isValidMove(rotatedMatrix, tetromino.row, tetromino.col)) {
        tetromino.matrix = rotatedMatrix;
    } else {
        // Si la rotación no es válida, intentar ajustar la posición horizontalmente
        let offset = 1;
        while (isValidMove(rotatedMatrix, tetromino.row, tetromino.col - offset)) {
            tetromino.col -= offset;
            offset++;
        }
        if (isValidMove(rotatedMatrix, tetromino.row, tetromino.col + offset)) {
            tetromino.col += offset;
        } else {
            // Si no se puede ajustar, revertir la matriz rotada
            tetromino.matrix = rotate(rotatedMatrix);
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (tetromino && !gameOver) {
        switch (e.code) {
            case 'ArrowLeft':
                moveTetrominoLeft();
                break;
            case 'ArrowRight':
                moveTetrominoRight();
                break;
            case 'ArrowDown':
                moveTetrominoDown();
                break;
            case 'ArrowUp':
                rotateTetromino();
                break;
        }
    }
});

document.getElementById('restartGame').addEventListener('click', () => {
    location.reload(); // Recargar la página para reiniciar el juego
});

document.getElementById('saveScore').addEventListener('click', () => {
    const playerName = prompt("Introduce tu nombre:");
    if (playerName) {
        const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
        highScores.push({ name: playerName, score: score });
        localStorage.setItem('highScores', JSON.stringify(highScores));
        alert('Puntuación guardada!');
    }
});
function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            if (playfield[row][col]) {
                const name = playfield[row][col] - 1;
                context.fillStyle = colors[name];
                context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
            }
        }
    }

    if (tetromino && !gameOver) {
        if (++count > 35) {
            tetromino.row++;
            count = 0;

            if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                tetromino.row--;
                placeTetromino();
            }
        }

        context.fillStyle = colors[tetromino.name];

        for (let row = 0; row < tetromino.matrix.length; row++) {
            for (let col = 0; col < tetromino.matrix[row].length; col++) {
                if (tetromino.matrix[row][col]) {
                    context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid - 1, grid - 1);
                }
            }
        }
    }

    if (!gameOver) {
        requestAnimationFrame(draw); // Utilizar directamente requestAnimationFrame
    }
}

// Llamar a la función draw inicialmente
draw();

// Iniciar el juego
rAF = requestAnimationFrame(draw);
