let ciphertext = "TNRZCMPTEEPXEZNEPRZCWZVHEPTGMMZZXXMFMMKLVREPBYO";

let letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

//English letter frequencies: https://www.sttmedia.com/characterfrequency-english
let frequencies = [0.0834, 0.0154, 0.0273, 0.0414, 0.1260, 0.0203, 0.0192, 0.0611, 0.0671, 0.0023, 0.0087, 0.0424, 0.0253, 0.0680,
    0.0770, 0.0166, 0.0009, 0.0568, 0.0611, 0.0937, 0.0285, 0.0106, 0.0234, 0.0020, 0.0204, 0.0006];

let key = "";

const keyLength = 3;

//Array of groups 
//Group to hold ciphertext letter of every keylength index starting at 0 and up to keylength
let groups = [];

//Initialize each group as an array
for (let i = 0; i < keyLength; i++) {
    groups[i] = [];
}

//Array to hold the letters of the first version of key (using chi-square --> rough key)
let pickedLetters = [];

//Array of ciphertext characters
let cipherTextChar = ciphertext.toLowerCase().split("");

//Add every keylength'th letter to a group
for (let i = 0; i < cipherTextChar.length; i += keyLength) {

    for (let j = 0; j < groups.length; j++) {
        groups[j].push(cipherTextChar[i + j]);
    }
}

//Decrypt function 
function caesarCipherDecrypt(char, keyCharIndex) {
    return char.toUpperCase().replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 - keyCharIndex + 26) % 26 + 65));
}

//Decrypt every group to find letter of each position of rough key
for (let i = 0; i < groups.length; i++) {
    decryptGroup(groups[i]);
}

//Decrypts a whole group and adds the best guessed letter to pickedLetters array 
function decryptGroup(group) {
    let groupString = group.join("");

    //Array to store caesar cipher decryption of all 26 letters of group string 
    //Array holds all 26 decrypted keys using all 26 letters
    let groupStringDecryptArray = [];
    //Decrypt for all letters
    for (let i = 0; i < letters.length; i++) {
        groupStringDecryptArray[i] = (caesarCipherDecrypt(groupString, i));
    }

    //Array to store all chi-squared test scores corresponding to all 26 letters
    let groupChiSquareSumArray = [];
    //Calculate chi square sum of 26 decryptions
    for (let i = 0; i < groupStringDecryptArray.length; i++) {
        groupChiSquareSumArray[i] = sumChiSquareLetterScore(groupStringDecryptArray[i]);
    }

    //Get the index of the minimum chi-squared test score
    let minIndex = groupChiSquareSumArray.indexOf(Math.min(...groupChiSquareSumArray));

    //Add the letter to pickedLetters index (will form rough key)
    pickedLetters.push(letters[minIndex]);
}

//Returns sum of all chi square tests of decrypted string
function sumChiSquareLetterScore(decryptedString) {

    //Keeps track of how many times letter repeats in group string
    let groupCount = [];
    //Count how many times letters repeat 
    for (let i = 0; i < letters.length; i++) {
        groupCount[i] = (decryptedString.split(`${letters[i].toUpperCase()}`).length - 1);
    }

    //Keeps tracks of chi-squared test score for corresponding letters
    let groupChiSquareScore = [];
    //Chi square each count 
    for (let i = 0; i < groupCount.length; i++) {
        if (groupCount[i] != 0) {
            groupChiSquareScore[i] = chiSquare(groupCount[i], frequencies[i], decryptedString.length);
        }
    }

    //Return the sum of all the chi-squared test scores of all the letters
    return groupChiSquareScore.reduce((a, b) => a + b, 0);
}


//Chi square function 
//Count = How many times letter appears in group string
//Percentage = English letter frequency percentage 
//stringLength = Length of decrypted group string 
function chiSquare(count, percentage, stringLength) {
    //Reference: http://practicalcryptography.com/cryptanalysis/text-characterisation/chi-squared-statistic/
    let chiSquareScore = (Math.pow((count - (stringLength * percentage)), 2)) / (stringLength * percentage);
    return chiSquareScore;
}

//Using File System
const fs = require("fs");

//Array to store words in usa2.text file
let dictionaryWords = [];

//Convert usa2.txt into string
const text = fs.readFileSync('usa2.txt', 'utf8');

//Convert string into array of words
dictionaryWords = text.toString().split("\n");

//Filter array of words for word length of 7
const keyLengthDictionaryWords = dictionaryWords.filter((n) => n.length == keyLength);

//Array to store how many letters of each 7 letter word matches the rough key's letters
let dictionaryWordsCount = [];

//Count how many letters of each 7 letter word matches the rough key's letters
for (let i = 0; i < keyLengthDictionaryWords.length; i++) {
    //Initialize count
    dictionaryWordsCount[i] = 0;

    //Check if rough key letters matches letters of 7-letter dictionary word
    for (let j = 0; j < keyLength; j++) {

        //If the letter at index of 7-letter word matches letter at index of rough key, increment the count
        if (keyLengthDictionaryWords[i].charAt(j) == pickedLetters[j]) {
            dictionaryWordsCount[i]++;
        }
    }
}

//Get the highest value in the dictionaryWordsCount array (most similar letters)
let highestValue = dictionaryWordsCount.indexOf(Math.max(...dictionaryWordsCount));

//Most likely key is 7 letter words with most similar letters 
key = keyLengthDictionaryWords[highestValue];

//String that is the key repeated for ciphertext length 
let repeatedKey = key.repeat(cipherTextChar.length);

//Array to store plaintext letters
let plaintextArray = [];

//Decrypt ciphertext using most likely keyword
for (let i = 0; i < cipherTextChar.length; i++) {
    plaintextArray[i] = caesarCipherDecrypt(cipherTextChar[i], letters.indexOf(repeatedKey.charAt(i)));
}

//String to store plaintext
let plaintext = plaintextArray.join("");

console.log("Rough Key: " + pickedLetters.join(""));
console.log("Key: " + key);
console.log("Plaintext: " + plaintext);