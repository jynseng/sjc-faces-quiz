let muted = false;
const ding1 = new Audio("assets/ESM_Correct_Answer_Bling_3_Sound_FX_Arcade_Casino_Kids_Mobile_App_Positive_Achievement_Win.wav"); // Correct first name
const ding2 = new Audio("assets/ESM_Correct_Answer_Bling_3_Sound_FX_Arcade_Casino_Kids_Mobile_App_Positive_Achievement_Win.wav"); // Correct last name
const newHighScoreSFX = new Audio("assets/ESM_Positive_Correct_Bling_v3_Sound_FX_Arcade_Casino_Kids_Mobile_App.wav");
const newRecordSFX = new Audio("assets/Anime WOW - Sound Effect (HD).mp3");
const loginSFX = new Audio("assets/ESM_Vibrant_Game_Slot_Machine_Ding_1_Arcade_Cartoon_Quirky_Comedy_Comedic_Kid_Childish_Fun_Bouncy.wav");
const countDownSFX = new Audio("assets/CountDownSFX.m4a");
const newOverallHighSFX = new Audio("assets/WowSFX.mp3");
const waveSFX = new Audio("assets/ESM_Congrats_Bell_Sound_FX_Arcade_Synth_Musical_Chord_Bling_Electronic_Casino_Kids_Mobile_Positive_Achievement_Score.wav");
loginSFX.volume = 0.2;
countDownSFX.volume = 0.2;
ding1.volume = 0.7;
ding2.volume = 0.7;
newHighScoreSFX.volume = 0.8;
waveSFX.volume = 0.3;
let debugEnabled = false;

// Debug mode
window.__enableDebug = function() {
    debugEnabled = true;
    console.log("Debug mode enabled");
};

window.__disableDebug = function() {
    debugEnabled = false;
    console.log("Debug mode disabled");
};

function isDebugEnabled() {
    return debugEnabled;
}

// Set focus to the input field when the page loads
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("playername").focus();
    if (!document.getElementById('playername').value.trim()) {
        document.getElementById('submitName').disabled = true;
    }
}, false);

// Esc key closes popup window
document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        console.log("escape");
        document.getElementById("gameoverWindow").style.display = "none";
        document.getElementById("combinedLeaderboardWindow").style.display = "none";
    }
});

// Register enter key as a click on submit button
document.getElementById("enterName").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent form submission
        document.getElementById("submitName").click(); // Simulate a click on the submit button
    }
});

// Register enter key as a click on submit button
document.getElementById("quizForm").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent form submission
        document.getElementById("submit").click(); // Simulate a click on the submit button
    }
});

// Block right-clicks to prevent cheating
document.getElementById("imageElement").addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

function preventInvalidInput(event) {
    const charCode = event.which || event.keyCode;
    const charStr = String.fromCharCode(charCode);
    const regex = /^[a-zA-Z\s\-]*$/; // Only letters and space allowed

    // If the character doesn't match the allowed pattern, prevent its input
    if (!regex.test(charStr)) {
        event.preventDefault();
    }
}

// Don't allow game start until user enters a name
document.getElementById('playername').addEventListener('input', function() {
    preventBlankInput(this.value, 'submitName');
});

function preventBlankInput(text, submitButton) {
    let textBoxValue = text.trim();  // Trim whitespace to check for actual input
    let button = document.getElementById(submitButton);
    
    if (textBoxValue) {
        button.disabled = false;  // Enable the button if there's input
    } else {
        button.disabled = true;   // Disable the button if the input is empty
    }
}

// Toggle the volume on or off
function toggleMute() {
    if (muted) {
        document.getElementById("muteButton").innerHTML = "🔊";
        countDownSFX.volume = 0.2;
        ding1.volume = 0.7;
        ding2.volume = 0.7;
        newHighScoreSFX.volume = 0.8;
        newRecordSFX.volume = 1;
        loginSFX.volume = 0.2;
        waveSFX.volume = 0.3;
        muted = false;
    } else {
        document.getElementById("muteButton").innerHTML = "🔇";
        countDownSFX.volume = 0;
        ding1.volume = 0;
        ding2.volume = 0;
        newHighScoreSFX.volume = 0;
        newRecordSFX.volume = 0;
        loginSFX.volume = 0;
        waveSFX.volume = 0;
        muted = true;
    }
}

function showSettings() {
    let seedInput = document.getElementById("seedDiv");
    let quizModeBox = document.getElementById("quizModeBox");
    if (seedInput.style.display == 'block') {
        seedInput.style.display = 'none';
        quizModeBox.style.display = 'none';
    } else {
        seedInput.style.display = 'block';
        quizModeBox.style.display = 'inline';
    }
}