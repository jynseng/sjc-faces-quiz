const checkIntervalActive = 8 * 1000; // Frequency of local activity check while user is active (8s)
const checkIntervalInactive = .3 * 1000; // Frequency of local activity check while waiting for user to return (.3s)
const inactiveThreshold = 3 * 60 * 1000; // Local activity timeout threshold (3 mins)
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
        
        switch (data.type) {
            case 'wave':
                if (data.from) {
                    toastMsg = "안녕! 👋 " + "<span class='sender'>" + data.from + "</span>  waved at you!";
                    waveSFX.play();
                    showToast(toastMsg, 'wave');
                } else {
                    console.log("Wave recieved but no fromUser");
                }
                break;
            case 'score':
                toastMsg = "";
                if (data.score == 0) { break; }
                switch (data.scoreStatus) {
                    case 'new high score': 
                        toastMsg =  "<span class='sender'>" + data.user + "</span> just set a new high score of <span class='score'>" + data.score + "</span> on " + data.gameMode + " mode! 🤯";
                        break;
                    case 'personal best':
                        toastMsg =  "<span class='sender'>" + data.user + "</span> just got <span class='score'>" + data.score + "</span> on " + data.gameMode + " mode! 👏";
                        break;
                    case 'poor':
                        toastMsg = "<span class='sender'>" + data.user + "</span> got a measly <span class='score'>" + data.score + "</span> on " + data.gameMode + " mode 😢";
                        break;
                    case 'pathetic':
                        toastMsg = "<span class='sender'>" + data.user + "</span> got an astoshingly pitiful <span class='score'>" + data.score + "</span> on " + data.gameMode + " mode 🤔";
                        break;
                    default: 
                        break;
                }
                showToast(toastMsg, 'score');
                break;
            default: // Default message is online user update
                activeUsers = data;
                let numActive = activeUsers.length;
                if (numActive < activeUsers.length) {
                    loginSFX.play();
                }
                userList.innerHTML = '';
                activeUsers.forEach(user => { // List each active user under "Online Now" on page
                    const li = document.createElement('li');
                    const span = document.createElement('span');
                    span.innerHTML = user;
                    li.appendChild(span);
                    if (user != playerName && loggedIn) { // If logged in, add button to wave to other users
                        li.appendChild(createWaveButton(user));
                    }
                    userList.appendChild(li);
                });
                break;
        }
    };
}

// Attach button element to given 
function createWaveButton(user) {
    const button = document.createElement('button');
    button.className = 'wave-button';
    button.textContent = '👋';
    button.addEventListener('click', () => { 
        ws.send(JSON.stringify({ type: "wave", to: user })); 
        // Disable and hide button after clicking to prevent spam
        button.disabled = true;
        button.style.display = "none";

        // Re-enable and show after 30s
        setTimeout(() => {
            button.disabled = false;
            button.style.display = "inline";
        }, 30000);
    });
    return button;
}

// Display discrete popup message
function showToast(message, type, duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type == 'wave') { toast.classList.add('wave'); }
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
            username: playerName,
            //userId: userId
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
    


}, checkInterval);

// Ping server to keep ws connection alive
setInterval(function () {
    // Ping ws to keep connection alive
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
    }
}, checkIntervalActive);

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