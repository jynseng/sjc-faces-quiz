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

document.getElementById('playername').addEventListener('input', function() {
    var textBoxValue = this.value.trim();  // Trim whitespace to check for actual input
    var submitButton = document.getElementById('submitName');
    
    if (textBoxValue) {
        submitButton.disabled = false;  // Enable the button if there's input
    } else {
        submitButton.disabled = true;   // Disable the button if the input is empty
    }
});