const checkIntervalActive = 5 * 1000; // Frequency of local activity check while user is active (4s)
const checkIntervalInactive = .5 * 1000; // Frequency of local activity check while waiting for user to return (.5s)
const inactiveThreshold = 2.5 * 60 * 1000; // Local activity timeout threshold (2.5 mins)
const userList = document.getElementById('userList');

let playerName;
let lastActivityTime = Date.now();
let activeUsers = [];
let loggedIn = false;
let active = true;
let checkInterval = checkIntervalActive;
let retryTimeout = 5000; // Time between reconnection attempts
let ws;

function initWebSocket() {
    ws = new WebSocket('wss://sjcfacesgame.com/ws/'); // wss for https

    ws.onopen = function (event) {
        console.log("ws connection is open");
    }

    ws.onerror = function(event) {
        console.log("Websocket can't connect: "+event);
        setTimeout(initWebSocket, retryTimeout);
    }

    ws.onmessage = function(msg) {
        let numActive = activeUsers.length;
        activeUsers = JSON.parse(msg.data);
        if (numActive < activeUsers.length) {
            loginSFX.play();
            console.log("new login");
        }
        // loggedIn = true;
        userList.innerHTML = '';
        activeUsers.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user;
            userList.appendChild(li);
        });
    };
}

function sendUsername(username) {
    if (ws.readyState === 1) {
        playerName = username;
        loggedIn = true;
        const message = JSON.stringify({
            type: 'sign_in', 
            username: playerName
        });
        loginSFX.play();
        ws.send(message);
    }
}

function sendInactive() {
    if (ws.readyState === 1) {
        const message = JSON.stringify({
            type: 'sign_out', 
            username: playerName
        });
        ws.send(message);
    }
}

// Check if user is still active locally every x seconds
setInterval(function () {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivityTime;

    if (loggedIn && timeSinceLastActivity > inactiveThreshold) { // User is inactive
        checkInterval = checkIntervalInactive;
        active = false;
        sendInactive(playerName);
    } else if (!active && loggedIn && timeSinceLastActivity < inactiveThreshold) { // User is active
        checkInterval = checkIntervalActive;
        sendUsername(playerName);
        active = true;
    }
}, checkInterval);

// Check for client activity
document.addEventListener('mousemove', function () {
    lastActivityTime = Date.now(); // Update the time on mouse movement
});
document.addEventListener('keydown', function () {
    lastActivityTime = Date.now(); // Update the time on mouse movement
});

initWebSocket();