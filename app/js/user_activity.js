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
    const WS_URL = location.hostname === "localhost"
        ? "ws://localhost:8080/"
        : "wss://sjcfacesgame.com/ws/";

    ws = new WebSocket(WS_URL); // wss for https

    ws.onopen = function (event) {
        console.log("Websocket connection is open");
    }

    ws.onerror = function(event) {
        console.log("Websocket can't connect: " + event);
        setTimeout(initWebSocket, retryTimeout);
    }

    ws.onclose = () => {
        console.log("Disconnected, retrying in 5s");
        setTimeout(initWebSocket, retryTimeout);
    };

    // Receive ws messages- can be either wave or active user update
    ws.onmessage = function(msg) {
        data = JSON.parse(msg.data);
        console.log(data);
        if (data.type === 'wave') {  // Handle wave case
            console.log("Wave received");
            if (data.from) {
                msg = "안녕! 👋 " + "<span class='sender'>" + data.from + "</span>  waved at you!";
                showToast(msg);
            } else {
                console.log("Wave recieved but no fromUser");
            }
        } else { // Handle active user case
            activeUsers = data;
            let numActive = activeUsers.length;
            if (numActive < activeUsers.length) {
                loginSFX.play();
            }
            userList.innerHTML = '';
            activeUsers.forEach(user => { // List each active user under "Online Now" on page
                const li = document.createElement('li');
                li.textContent = user;
                if (user != playerName) { // If not self, add button to wave
                    const button = document.createElement('button');
                    button.textContent = 'wave 👋';
                    button.addEventListener('click', () => {
                        console.log("Waving to " + user);
                        ws.send(JSON.stringify({ type: "wave", to: user }));
                    });
                    li.appendChild(button);
                }
                userList.appendChild(li);
            });
        }
    };
}

// Display discrete popup message
function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 50);

    // Remove after duration
    setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => container.removeChild(toast), 300);
    }, duration);
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
    } else {
        console.log("Tried to send active, but failed :(");
    }
}

function sendInactive() {
    if (ws.readyState === 1) {
        const message = JSON.stringify({
            type: 'sign_out', 
            username: playerName
        });
        ws.send(message);
    } else {
        console.log("Tried to send inactive, but failed :(");
    }
}

// Check if user is still active locally every x seconds
setInterval(function () {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivityTime;

    if (loggedIn && timeSinceLastActivity > inactiveThreshold) { // User is inactive
        console.log("User is inactive");
        checkInterval = checkIntervalInactive;
        active = false;
        sendInactive(playerName);
    } else if (!active && loggedIn && timeSinceLastActivity < inactiveThreshold) { // User is active
        checkInterval = checkIntervalActive;
        sendUsername(playerName);
        active = true;
    }
    
    // Ping ws to keep connection alive
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
    }

}, checkInterval);

// Check for client activity
document.addEventListener('mousemove', function () {
    lastActivityTime = Date.now(); // Update the time on mouse movement
});
document.addEventListener('keydown', function () {
    lastActivityTime = Date.now(); // Update the time on mouse movement
});
// On window close, send signout 
// window.addEventListener("beforeunload", () => {
//     navigator.sendBeacon("/signout.php", JSON.stringify({ type:"sign_out", username: playerName }));
// });

initWebSocket();