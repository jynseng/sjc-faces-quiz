const checkInterval = 1000 * 10; // Frequency of local activity check (10s)
const sendInterval = 30 * 1000 // Frequency of activity refreshing (30s)
const inactiveThreshold = 4 * 60 * 1000; // Local activity timeout threshold (4 min)
var lastActivityTime = Date.now();
activeUsers = [];
userList = document.getElementById('userList');
var refreshInterval;

// Long-polling for active user list updates
function fetchActiveUsers(username, init='false') {
    fetch('server/sessions.php?' + new URLSearchParams({username:username, init:init}), { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            if (data) {
                activeUsers = data.activeUsers;
                // console.log("activeUsers: ");
                // console.log(activeUsers);
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
    refreshInterval = setInterval(function() {
        fetch('server/activity.php', { method: 'GET' })
            .then(data=> { console.log(data); })
    }, sendInterval);
}

// Check if user is still active locally every 5 mins
setInterval(function () {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivityTime;

    if (timeSinceLastActivity > inactiveThreshold) {
        clearInterval(refreshInterval);
        // Stop long-polling
    } else {
        startActivity();
        // Start long-polling
    }
}, checkInterval);

// Check for client activity
document.addEventListener('mousemove', function () {
    lastActivityTime = Date.now(); // Update the time on mouse movement
});
document.addEventListener('keydown', function () {
    lastActivityTime = Date.now(); // Update the time on mouse movement
});