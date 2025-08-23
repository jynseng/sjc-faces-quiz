let input = "Big mama chung";
let inputFirst = input.slice(0, -1).join(" ") || input[0]; // everything except last word, or just first word if only one
console.log("first: " + inputFirst);
let inputLast = input.length > 1 ? input[input.length - 1] : "";
let correctAnswer = currentFace.toLowerCase().replace(/'/g, "").split("_"); // ["sue ann", "park"]
let correctFirst = correctAnswer.slice(0, -1).join(" ");
let correctLast = correctAnswer[correctAnswer.length - 1];

if (inputFirst === correctFirst || (faces_all[currentFace].nicknames.includes(inputFirst))) {
    console.log("Correct");
}