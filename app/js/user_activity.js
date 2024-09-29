const checkIntervalActive = 5 * 1000; // Frequency of local activity check while user is active (5s)
const checkIntervalInactive = .5 * 1000; // Frequency of local activity check while waiting for user to return (.5s)
const inactiveThreshold = 2 * 60 * 1000; // Local activity timeout threshold (2 mins)
const userList = document.getElementById('userList');

let playerName;
let lastActivityTime = Date.now();
let activeUsers = [];
let loggedIn = false;
let active = true;
let checkInterval = checkIntervalActive;

let ws = new WebSocket('wss://157.173.212.243:8080/');
//let ws = new WebSocket('wss://157.173.212.243:8080/');
// ws.onopen = function(e) {
//     console.log("Connection established!");
// };

ws.onmessage = function(msg) {
    activeUsers = JSON.parse(msg.data);
    loggedIn = true;
    userList.innerHTML = '';
    activeUsers.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        userList.appendChild(li);
    });
};

function sendUsername(username) {
    playerName = username;
    loggedIn = true;
    console.log(playerName);
    const message = JSON.stringify({
        type: 'sign_in', 
        username: playerName
    });
    loginSFX.play();
    ws.send(message);
}

function sendInactive() {
    const message = JSON.stringify({
        type: 'sign_out', 
        username: playerName
    });
    ws.send(message);
}

// Check if user is still active locally every 15 seconds
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