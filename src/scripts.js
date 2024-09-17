import * as THREE from 'three';
import * as utils from './utils.js';
import {Player} from './player.js';
import io from 'socket.io-client';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {ARENA_SIZE, LINE_SIZE, FPS, PLAYER_SPEED, ROTATION_SPEED, TUBE_SEGMENTS, ANIMATE_COUNTER_NUM, COUNTDOWN} from './constants.js'

const socket = io(`:8080/`, {
    transports: ['websocket']
});

console.log('Attempting to connect to server...');

socket.on('connect', () => {
    console.log('Connected to server');
});

/////////////////GAME INITIALIZATION/////////////////////
let players = [];

let player;

const gameOverScreen = document.getElementById('gameOverScreen');
gameOverScreen.style.display = 'none';

function isValidHexColor(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex);
}

function getRandomHexColor() {
    const randomColor = Math.floor(Math.random() * 16777215);
    return `#${randomColor.toString(16).padStart(6, '0')}`;
}

const startGameButton = document.getElementById('startGameButton');
startGameButton.disabled = true;
startGameButton.addEventListener('click', () => {
    socket.emit('gameStarted');
    startGameButton.disabled = true;
});
socket.on('first', () => {
    startGameButton.disabled = false;
});

function initializeGame(playerColor, serverTime) {
    player = createPlayer(playerColor);
    initializePoints(player.color);
    socket.emit('newPlayer', player);
    //Countdown synced with server clock
    //Time to initialize player objects, positions and server positions
    const timeToStart = (serverTime+ (COUNTDOWN*1000)) - Date.now() + timeOffset;
    
    const countdown = document.getElementById('countdown');
    const startScreen = document.getElementById('startScreen');
    countdown.style.display = 'block';
    
    let countdownValue = COUNTDOWN;
    countdown.innerHTML = countdownValue.toString();
    const countdownInterval = setInterval(() => {
        countdownValue--;
        countdown.innerHTML = countdownValue.toString();

        if (countdownValue === 0) {
            clearInterval(countdownInterval);
            startScreen.style.display = 'none';
            countdown.style.display = 'none';
            const interval = 1000 / FPS;
            const gameLoop = setInterval(() => {
                animate();
            }, interval);
        }
    }, timeToStart / COUNTDOWN);

}

function createPlayer(color) {
    player = new Player(socket.id, socket.id, color);
    scene.add(player.mesh);
    return player;
}

function initializePoints(color) {
    const tempDir = new THREE.Vector3();
    const behindPlayer = new THREE.Vector3();
    
    player.camera.getWorldDirection(tempDir);
    behindPlayer.copy(player.mesh.position).addScaledVector(tempDir, -2);
    player.points.push(new THREE.Vector3(behindPlayer.x, behindPlayer.y, behindPlayer.z));
    behindPlayer.copy(player.mesh.position).addScaledVector(tempDir, -1);
    player.points.push(new THREE.Vector3(behindPlayer.x, behindPlayer.y, behindPlayer.z));
    
    player.tubeObject = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(player.points),TUBE_SEGMENTS , LINE_SIZE, 8, false),
        new THREE.MeshBasicMaterial({ color: color })
    );
}

///////////////////////////////////////////////////



/////////////////SOCKET LISTENERS/////////////////////
const colorInput = document.getElementById('colorInput');
let timeOffset = 0;

socket.on('gameStarted', (serverTime) => {
    const selectedColor = colorInput.value;
    timeOffset = Date.now() - serverTime;
    if (isValidHexColor(selectedColor)) {
        playerColor = selectedColor || getRandomHexColor();
        initializeGame(playerColor, serverTime);
    }else{
        playerColor = getRandomHexColor();
        initializeGame(playerColor, serverTime);
    }
});


socket.on('players', (playerList) => {
    players = playerList;
    for (let i = 0; i < players.length; i++) {
    
    const points = players[i].points.map(point => new THREE.Vector3(point.x, point.y, point.z));
    players[i].points = points;

    players[i].tubeObject = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(players[i].points),TUBE_SEGMENTS , LINE_SIZE, 8, false),
        new THREE.MeshBasicMaterial({ color: players[i].color })
    );
    scene.add(players[i].tubeObject);
    }

    //Updates player name to index in array -> matching server
    for (let i = 0; i < players.length; i++) {
        if (player.id === players[i].id) {
            player.name = players[i].name;
            break; 
        }
    }
});

socket.on('playerMovement', (data, playerName) => {
    if(player.name == playerName){
        return;
    }
    console.log(JSON.stringify(players[playerName]));
    console.log(data)
    players[playerName].mesh.position.x = data.x;
    players[playerName].mesh.position.y = data.y;
    players[playerName].mesh.position.z = data.z;
});

socket.on('playerCurve', (data, playerName) => {
    if(player.name == playerName){
        return;
    }
    let tempPlayer = players[playerName];
    tempPlayer.points.push(new THREE.Vector3(data.x, data.y, data.z));
    const newCurve = new THREE.CatmullRomCurve3(tempPlayer.points);
    const newTubeGeometry = new THREE.TubeGeometry(newCurve, TUBE_SEGMENTS, LINE_SIZE, 8, false);

    scene.remove(tempPlayer.tubeObject);
    tempPlayer.tubeObject.geometry.dispose();
    tempPlayer.tubeObject.geometry = newTubeGeometry;
    scene.add(tempPlayer.tubeObject);
});

socket.on('gameOver', (winner) => {
    const gameOverScreen = document.getElementById('gameOverScreen');
    if(player.name == winner){
        const winnerText = document.getElementById('winnerText');
        winnerText.innerHTML = 'YOU WIN!';
    }
    else{
        const winnerText = document.getElementById('winnerText');
        winnerText.innerHTML = 'YOU LOSE!';
    }
    gameOverScreen.style.display = 'flex';
});

/////////////////////////////////////////////////////


const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

utils.create_arena_with_grid(scene, ARENA_SIZE);
const sunObject = utils.createSun(scene);


/////////////////MOVEMENT////////////////////////////
const keys = {};

document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

function handleMovement() {
    const cameraDirection = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();
    const cameraUp = new THREE.Vector3();

    player.camera.getWorldDirection(cameraDirection);
    cameraDirection.normalize();

    cameraUp.copy(new THREE.Vector3(0, 1, 0)).applyQuaternion(player.camera.quaternion).normalize();
    cameraRight.crossVectors(cameraUp, cameraDirection).normalize();

    const quaternion = new THREE.Quaternion();

    if (keys['KeyW']) {
        quaternion.setFromAxisAngle(cameraRight, -ROTATION_SPEED);
        player.camera.quaternion.multiplyQuaternions(quaternion, player.camera.quaternion).normalize();
    }
    if (keys['KeyS']) {
        quaternion.setFromAxisAngle(cameraRight, ROTATION_SPEED);
        player.camera.quaternion.multiplyQuaternions(quaternion, player.camera.quaternion).normalize();
    }
    if (keys['KeyA']) {
        quaternion.setFromAxisAngle(cameraUp, ROTATION_SPEED);
        player.camera.quaternion.multiplyQuaternions(quaternion, player.camera.quaternion).normalize();
    }
    if (keys['KeyD']) {
        quaternion.setFromAxisAngle(cameraUp, -ROTATION_SPEED);
        player.camera.quaternion.multiplyQuaternions(quaternion, player.camera.quaternion).normalize();
    }

    player.camera.updateMatrixWorld();

    // socket.emit('playerMovement', {
    //     position: {
    //         x: player.mesh.position.x,
    //         y: player.mesh.position.y,
    //         z: player.mesh.position.z
    //     }
    // }, player.name);

}
//////////////////////////////////////////////


// Reset player position
let controls;
function killPlayer() {

    player.alive = false;
    socket.emit('playerDied', player.name);

    controls = new OrbitControls(player.camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    player.mesh.position.set(0, 0, 0);
    player.camera.position.set(0, 5, 10);
    controls.target.set(0, 0, 0); 
    controls.update();
}


// Update the snake/tube trail as the players move
//TODO: Optimize number of curve points, createa a totally new object sometimes and just leave the old curve be
//that should reduce jittering
function updateCurve(newPoints) {
    player.points.push(...newPoints);
    const newCurve = new THREE.CatmullRomCurve3(player.points);
    const newTubeGeometry = new THREE.TubeGeometry(newCurve, TUBE_SEGMENTS, LINE_SIZE, 8, false);

    scene.remove(player.tubeObject);

    player.tubeObject.geometry.dispose();
    player.tubeObject.geometry = newTubeGeometry;

    scene.add(player.tubeObject);
}

// Check collisions with player’s own tube and other players
function checkCollisions() {
    const playerPosition = player.mesh.position;

    const distanceToSun = playerPosition.distanceTo(sunObject.position);
    if (distanceToSun < 5.3) {
        killPlayer();
        return;
    }

    const halfSize = ARENA_SIZE / 2;
    if (Math.abs(playerPosition.x) > halfSize || Math.abs(playerPosition.y) > halfSize || Math.abs(playerPosition.z) > halfSize) {
        killPlayer();
        return;
    }
    checkTubeCollisions();

}

// Check if the player is colliding with any tube (self or others)
function checkTubeCollisions() {
    const playerPosition = player.mesh.position;

    for(let i = 0; i < players.length; i++){
        if(player.name == players[i].name){
            continue;
        }
        const curve = players[i].tubeObject.geometry.parameters.path;
        const points = curve.getPoints(TUBE_SEGMENTS);
    
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
    
            const closestPoint = closestPointOnSegment(playerPosition, start, end);
            const distance = playerPosition.distanceTo(closestPoint);
    
            if (distance < LINE_SIZE) {
                killPlayer();
                return;
            }
        }
    }

    const curve = player.tubeObject.geometry.parameters.path;
    const points = curve.getPoints(TUBE_SEGMENTS);

    for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];

        const closestPoint = closestPointOnSegment(playerPosition, start, end);
        const distance = playerPosition.distanceTo(closestPoint);
        if (distance < LINE_SIZE) {
            killPlayer();
            return;
        }
    }
    
}

// Calculate the closest point on a line segment to check collisions
function closestPointOnSegment(point, start, end) {
    const segmentVector = new THREE.Vector3().subVectors(end, start);
    const pointVector = new THREE.Vector3().subVectors(point, start);

    const t = Math.max(0, Math.min(1, pointVector.dot(segmentVector) / segmentVector.lengthSq()));

    return new THREE.Vector3().copy(segmentVector).multiplyScalar(t).add(start);
}

let animateCounter = 0;
// Game animation loop
function animate() {

    if(player.alive === false){
        controls.update();
        renderer.render(scene, player.camera);
        return;
    }
    handleMovement();

    animateCounter++;

    const cameraDirection = new THREE.Vector3();
    player.camera.getWorldDirection(cameraDirection);
    player.mesh.position.addScaledVector(cameraDirection, PLAYER_SPEED);


    if (animateCounter === ANIMATE_COUNTER_NUM) {
        const tempDir = new THREE.Vector3();
        const behindPlayer = new THREE.Vector3();
        player.camera.getWorldDirection(tempDir);
        behindPlayer.copy(player.mesh.position).addScaledVector(tempDir, -0.4);
        updateCurve([behindPlayer]);
        socket.emit('playerCurve', behindPlayer, player.name);
    }

    animateCounter = animateCounter % (ANIMATE_COUNTER_NUM);

    checkCollisions();

    renderer.render(scene, player.camera);
}

