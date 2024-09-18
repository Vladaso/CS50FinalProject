// @ts-check
import { Player } from './src/player.js';
import express from 'express';
import http from 'http';
import { Server as socketIo } from 'socket.io';
import {COUNTDOWN} from './src/constants.js';

const app = express();
const server = http.createServer(app);

let gameStarted = false;
let first = false;
let deaths = 0;

//@ts-ignore
const io = new socketIo(server, { 
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }

});
/**
 * @type {Player[]}
 */
let players = [];



io.on('connection', (socket) => {
    if(gameStarted){
        console.log(`Tried to joing during game: ${socket.id}`)
        socket.disconnect();
    }
    console.log(`Player connected: ${socket.id}`);
    if(!first){
        socket.emit('first');
    }
    first = true;

    socket.on('newPlayer', (player) => {
        console.log("New player created: " + socket.id);
        players.push(player);
    });

    socket.on('playerMovement', (data, playerName) => {
        io.emit('playerMovement', data, playerName);
    });

    socket.on('playerCurve', (data, playerName) => {
        io.emit('playerCurve', data, playerName);
    });

    socket.on('gameStarted', () => {
        console.log('Game started');
        io.emit('gameStarted',Date.now());
        gameStarted = true;

        setTimeout(() => {
            players.forEach((player, index) => {
                player.name = index;
            });
            io.emit('players', players);
        }, COUNTDOWN * 800);

    });

    socket.on('playerDied', (playerName) => {
        console.log('Player died: ' + playerName);
        players[playerName].alive = false;
        deaths++;
        if(deaths >= players.length - 1){
            let winner = 0;
            for(let i = 0; i<players.length; i++){
                if(players[i].alive){
                    winner = players[i].name;
                    break;
                }
            }
            io.emit('gameOver', winner);
            io.sockets.sockets.forEach((socket) => {
                socket.disconnect(true);
            });
            gameStarted = false;
            first = false;
            deaths = 0;
            players = [];
        }
    });
});

io.on('disconnect', (socket) => {
    console.log(`Player disconnected: ${socket.id}`);
});


server.listen(1234, () => {
    console.log('Server is running on port 1234');
});


import { spawn } from 'child_process';
//starts nginx.exe but doesnt shut it down
spawn('cmd', ['/K', 'nginx.exe -c conf\\nginx.conf'], { cwd: 'C:\\nginx\\nginx-1.27.1' });

