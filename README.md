# Wurmie3D

#### Video Demo: [URL HERE]

#### Description

Multiplayer Slither.io in 3D. Inspired by WurmieMania, a game often played at Trojsten meetings and assemblies. The game has you controlling a "WURM" with WASD in a 3D environment trying not to collide with yours, or other players tails. The game will receive a few more updates from me, but it is finished for the CS50 part. I spent a few weeks on it and I'm very proud. I learned how to work with Three.js and multiple other tools from scratch!

## How to Run

1. **Install Node.js**: Ensure you have Node.js installed on your machine.
2. **Install and Setup Nginx**: Used for port forwarding. Update paths in `server.js` and `update_nginx_config.js` for Nginx config to be updated properly and for Nginx to start once you create the server. You have to quit Nginx yourself; you can see it in your Task Manager.

### Nginx Configuration

Put the following into your `nginx.conf` file:

```nginx
events {}

http {
    server {
        listen 8080;

        server_name 192.168.169.87;

        # HTTP traffic forwarded to Parcel (port 3000)
        location / {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket traffic forwarded to game server (port 1234)
        location /socket.io/ {
            proxy_pass http://localhost:1234;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```
Don't worry about the IP in nginx.conf nor in scripts.js, it is dynamically configured when you start the server.

### Steps to Run

1. **Install Dependencies**: Run `npm install` in your console. This will install all the necessary packages needed for running the server.
2. **Start the Server**: Run `npm run start` in your console. This starts a Parcel server on port 3000 that serves the HTML, and it also starts the Socket.IO server on port 1234 that handles the player connections. Lastly, you will get an IP in your console. This is the IP you share with the other players. They connect to it by putting it in their browser with `:8080` at the end, specifying the port Nginx is listening to. Make sure all these ports are available; if not, you have to configure them manually. It should look something like this: `http://192.168.169.87:8080/`. You have to be on the same network to be able to connect. This can be easily changed if you use ngrok, for example, but you will need the paid plan for it to work with multiple agents.

### After Ending the Server

You should also manually kill Nginx.

## File Descriptions

### `server.js`

- **Description**: Main server file, runs the socketIO server, communicates with other players, keeps track of connections as well as player objects, at the end also initializes nginx. Since the game loop is implemented correctly, this file should only run once.

### `update_nginx_config.js`

- **Description**: Updates the nginx.conf file to have the specified localIP - also finds the ip out, during the server start up this file runs before all the others so it can update the config before it is used. Since the scripts.js is ran on the browser side the IP somehow had to be passed to the scripts.js file, so it also replaces the IP in the scripts.js file so it knows what IP to connect to without having to manually change the code each time.

### `index.html`

- **Description**: Main html file served through parcel has some minor styling added into it, didn't find making a css file neccessary. Allows you to choose a color and informs you of the game status.

### `package.json`

- **Description**: Contains metadata about the project and lists dependencies.

### `constants.js`

- **Description**: Contains all of the used constants, if you find the game boring you can fiddle a bit with these :D.

### `player.js`

- **Description**: Very important player object, creates the playerMesh, playerCamera and sets the playerColor. Used in server.js and scripts.js.

### `scripts.js`

- **Description**: Main javascript file served to the client contains almost all of the neccessary logic for playing the game, since it's such a big file I will describe some functions in more detail.
- **Functions**:
- - **main**: This is not a function simply the code outside functions, we connect to our socketIO server, we also initialize a players array of Player objects which will be described later. We initialize the WebGLRenderer, scene and the arena we also add event listeners for keydowns and keyups for proper movement.
- - **isValidHexColor getRandomHexColor**: Two functions relating to player color one checks with a regex if a hex color is valid if it is not the other generates a random one.
- - **initializeGame**: Called upon game start calls `initializePoints` that creates the player tubeObject which is the trail of the WURM. Also creates a player object calling `createPlayer` . After that it syncs with the server clock and starts the countdown which eventually starts the gameLoop which calls the `animate` function FPS times a second, FPS being a constant from **constants.js**.
- - **handleMovement**: Checks if any keys are pressed, if they are rotates the player a certain amount.
- - **killPlayer**: Using OrbitControls makes the player a spectator, also emits 'playerDied' into the socket.
- - **updateCurve**: Function used for updating the curve, it receives a new point as a parameter and updates the object as such.
- - **checkCollisions**: Check collisions with the sun and the arena walls, then calls `checkTubeCollisions`, which check for any collisions with any tubes. This is highly ineffective, yet I haven't found a better way. 
- - **closestPointOnSegment**: Helper function for checkTubeCollisions, does exactly as named.
- **Socket Listeners**:
- - **gameStarted**: When received intializes playerColor and calls the `initializeGame` function.
- - **players**: When received along with the playerList from the server also updates the players array locally, has to recreate each of the tubeObjects from the points sent, as the emission stringified the objects. Also syncs the player.name for each player with the server, so it knows how to refer to them and whose objects to update.
- - **playerMovement playerCurve**: The movement currently isn't streamed, it isn't needed, but this will be updated when a suitable model for the player head is found. playerCurve updates the curve of a player who sent the message.
- - **gameOver**: Displays the GameOver screen and whether you won or not.
