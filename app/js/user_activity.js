const checkIntervalActive = 5 * 1000; // Frequency of local activity check while user is active (5s)
const checkIntervalInactive = .5 * 1000; // Frequency of local activity check while waiting for user to return (.5s)
const sendInterval = 2 * 1000 // Frequency of activity refreshing to server (2s)
const inactiveThreshold = .5 * 60 * 1000; // Local activity timeout threshold (30 sec)
var lastActivityTime = Date.now();
activeUsers = [];
userList = document.getElementById('userList');
var refreshInterval;
var loggedIn = false;
var checkInterval = checkIntervalActive;

// Long-polling for active user list updates
function fetchActiveUsers(username, init='false') {
    if (init == 'true') { loginSFX.play(); }
    fetch('server/sessions.php?' + new URLSearchParams({username:username, init:init}), { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            if (data) {
                activeUsers = data.activeUsers;
                userList.innerHTML = '';
                if (activeUsers[0] != 'empty') {
                    activeUsers.forEach(user => {
                        const li = document.createElement('li');
                        li.textContent = user;
                        userList.appendChild(li);
                    });
                }
            }
            fetchActiveUsers(username); // Call again to continue long-polling
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation: ', error);
        });
}

// Poll server every x seconds to keep session active
function startActivity() {
    loggedIn = true;
    if (!refreshInterval) {
        refreshInterval = setInterval(function() {
            fetch('server/activity.php', { method: 'GET' })
                .then(data=> { 
                    //console.log(data); 
                })
        }, sendInterval);
    }
}

// Check if user is still active locally every 15 seconds
setInterval(function () {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivityTime;

    if (timeSinceLastActivity > inactiveThreshold && refreshInterval) { // User is inactive
        clearInterval(refreshInterval);
        refreshInterval = null;
        // console.log("Stopping activity");
        checkInterval = checkIntervalInactive;
    } else if (loggedIn && timeSinceLastActivity < inactiveThreshold && !refreshInterval) {
        startActivity(); // User is active
        // console.log("starting activity");
        checkInterval = checkIntervalActive;
    }
}, checkInterval);

// Check for client activity
document.addEventListener('mousemove', function () {
    lastActivityTime = Date.now(); // Update the time on mouse movement
});
document.addEventListener('keydown', function () {
    lastActivityTime = Date.now(); // Update the time on mouse movement
});