let wrong = 0; // Number of wrong answers
let skips = 0; // Number of faces skipped
let blinker; // Makes high score blink on leaderboard
let confetti = false; // Has the confetti been animated already?

export function fetchScores(userId, score=0, gameModeId=null, gameModeTitle=null, combined=false, gameOver=true) {
    var fetchURL;
    var fetchOptions;

    if (combined || !gameModeId) {
        fetchURL = 'server/combinedLeaderboard.php';
        fetchOptions = {method: 'GET'}
    }
    else {
        fetchURL = 'server/updateScores.php';
        fetchOptions = {
            method: 'POST',
            body: JSON.stringify({
                status: gameOver, 
                name: playerName, 
                userId: userId, 
                score: score, 
                gameModeId: gameModeId, 
                errors: wrong, 
                skips: skips})
        }
    }
    fetch(fetchURL, fetchOptions)
        .then(response => response.json())
        .then(data => {
            // Display top score leaderboard
            const scoreStatus = data.scoreStatus; // High score, personal high score, etc.
            const scores = data.scores; // Array of username-score pairs

            var leaderboardTable;
            var leaderboardWindow;
            if (combined) { // Combined leaderboard
                leaderboardTable = document.getElementById("combinedLeaderboard");
                leaderboardWindow = document.getElementById("combinedLeaderboardWindow"); 
            } else { // Normal leaderboard for that game mode
                leaderboardTable = document.getElementById("leaderboard");
                leaderboardWindow = document.getElementById("gameoverWindow");
                const leaderboardHeader = document.getElementById("leaderboardHeader");
                leaderboardHeader.innerHTML = "HIGH SCORES<br>";
                let modeTitle = document.createElement("small");
                modeTitle.innerHTML = gameModeTitle.toUpperCase();
                leaderboardHeader.appendChild(modeTitle);
            }
            clearInterval(blinker);
            leaderboardTable.innerHTML = "";
            var sortedScores = scores;
            var index = 0;
            if (document.getElementById("combinedLeaderboardWindow").checkVisibility()) {
                document.getElementById("combinedLeaderboardWindow").style.display = "none";
            }
            leaderboardWindow.style.display = "block"; // Show popup window

            for (var i = 0; i<25; i++) {
                if (!scores[i] && i > 9) { // If less than 10 scores to show, exit early
                    return; 
                }

                var ending = "th";
                if (i === 0 || i === 20) {
                    ending = "st"; 
                } else if (i === 1 || i === 21) {
                    ending = "nd";
                } else if (i === 2 || i === 22) {
                    ending = "rd";
                }

                // Create new row with three cells (for place, name, and score) and append to table
                const row = document.createElement('tr');
                
                const cell1 = document.createElement('td');
                cell1.textContent = i + 1 + ending.toUpperCase();
                row.appendChild(cell1);

                const cell2 = document.createElement('td');
                var username = 'EMPTY';
                var highScore = 0;
                if (scores[i]) {
                    username = scores[i].username.toUpperCase();
                    highScore = scores[i].high_score;
                }
                cell2.textContent = username;
                row.appendChild(cell2);

                const cell3 = document.createElement('td');
                cell3.textContent = highScore;
                row.appendChild(cell3);
                row.style.color = "black";
                leaderboardTable.appendChild(row);

                // If player score is top ten and new, highlight & blink 
                if (scores[i]) {
                    if (!combined && 
                        sortedScores[index].high_score == score && 
                        scores[i].username == playerName &&
                        scoreStatus == 'new high score' ||
                        scoreStatus == 'personal best'
                    ) {
                        row.style.color = "white";

                        // Make score blink for 15 seconds
                        var text = row;
                        blinker = setInterval(function() {
                            text.style.opacity = (text.style.opacity == '0' ? '1' : '0');
                        }, 400);
                        setTimeout(function() {
                            clearInterval(blinker);
                            text.style.opacity = "1";
                        }, 15000);

                        // If new top score, play confetti and sfx
                        if (i === 0) {
                            newRecordSFX.play();
                            document.getElementById("confettiCanvas").style.display = "block";
                            if (!confetti) { animate(); } // Play confetti visual effect
                            alert("Congrats on setting the new high score!\nYou are SO SMART and SO CAPABLE.");
                        } else {
                            newHighScoreSFX.play();
                        }
                    }
                }
                index++;
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
        })
}

export function incrementSkips() {
    skips++;
}

export function incrementWrong() {
    wrong++;
}

export function getWrong() {
    return wrong;
}

export function getSkips() {
    return skips;
}

export function resetCounters(){
    wrong = 0;
    skips = 0;
    confetti = false;
}