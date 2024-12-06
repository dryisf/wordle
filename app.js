function isLetter(character) {
  return /^[a-zA-Z]$/.test(character);
}

let currentRow = 0;
let currentBox = 0;
let gameIsOver = false;
let wordIsBeingChecked = false;

function changeLoaderState(isLoading) {
  const loaderHtmlElement = document.querySelector(".loader");

  if (isLoading) {
    loaderHtmlElement.classList.remove("hidden");
  } else {
    loaderHtmlElement.classList.add("hidden");
  }
}

function getCurrentRowInputsList() {
  const currentRowHtmlElement = document
    .querySelectorAll(".inputs-row")
    .item(currentRow);

  return currentRowHtmlElement.querySelectorAll(".letter-input");
}

const removeLetterFromBox = () => {
  const currentInputHtmlElement = getCurrentRowInputsList().item(currentBox);

  currentInputHtmlElement.setAttribute("value", "");

  if (currentBox > 0) {
    currentBox--;
  }
};

const addLetterToBox = letter => {
  const letterInputsList = getCurrentRowInputsList();
  const currentInputHtmlElement = letterInputsList.item(currentBox);

  currentInputHtmlElement.setAttribute("value", letter.toUpperCase());

  if (currentBox < letterInputsList.length - 1) {
    currentBox++;
  }
};

async function isWordValid(word) {
  const promise = await fetch("https://words.dev-apis.com/validate-word", {
    method: "POST",
    body: JSON.stringify({ word }),
  });

  const payload = await promise.json();

  return payload.validWord;
}

function isLetterInWord({
  playerWord,
  winningWord,
  letter,
  matchingLetterIndexes,
  closeLetterIndexes,
}) {
  let letterIterationsInWord = 0;
  let letterIterationsAlreadyCounted = 0;

  for (let i = 0; i < winningWord.length; i++) {
    if (winningWord[i] === letter) {
      letterIterationsInWord++;
    }
  }

  if (letterIterationsInWord === 0) {
    return false;
  }

  for (index of matchingLetterIndexes) {
    if (playerWord[index] === letter) {
      letterIterationsAlreadyCounted++;
    }
  }

  for (index of closeLetterIndexes) {
    if (playerWord[index] === letter) {
      letterIterationsAlreadyCounted++;
    }
  }

  return letterIterationsAlreadyCounted < letterIterationsInWord;
}

async function isWordAMatch(playerWord) {
  const winningWordPromise = await fetch(
    "https://words.dev-apis.com/word-of-the-day"
  );
  const winningWordPayload = await winningWordPromise.json();
  const winningWord = "pools";

  let matchingLetterIndexes = [];
  let notMatchingLetterIndexes = [];
  let closeLetterIndexes = [];

  const normalizedPlayerWord = playerWord.toUpperCase();
  const normalizedWinningWord = winningWord.toUpperCase();

  for (let i = 0; i < normalizedWinningWord.length; i++) {
    const playerWordLetter = normalizedPlayerWord[i];

    if (playerWordLetter === normalizedWinningWord[i]) {
      matchingLetterIndexes.push(i);
    } else if (
      isLetterInWord({
        playerWord: normalizedPlayerWord,
        winningWord: normalizedWinningWord,
        letter: playerWordLetter,
        matchingLetterIndexes,
        closeLetterIndexes,
      })
    ) {
      closeLetterIndexes.push(i);
    } else {
      notMatchingLetterIndexes.push(i);
    }
  }

  return {
    winningWord,
    playerHasWon: normalizedWinningWord === normalizedPlayerWord,
    matchingLetterIndexes,
    notMatchingLetterIndexes,
    closeLetterIndexes,
  };
}

function highlightLetters({
  wordIsValid,
  matchingLetterIndexes = [],
  notMatchingLetterIndexes = [],
  closeLetterIndexes = [],
}) {
  const inputsList = getCurrentRowInputsList();
  inputsList.forEach((input, index) => {
    if (!wordIsValid) {
      input.classList.add("invalid");
      setTimeout(() => {
        input.classList.remove("invalid");
      }, 1000);
    } else if (matchingLetterIndexes.includes(index)) {
      input.classList.add("correct");
    } else if (closeLetterIndexes.includes(index)) {
      input.classList.add("close");
    } else if (notMatchingLetterIndexes.includes(index)) {
      input.classList.add("incorrect");
    }
  });
}

async function checkWord() {
  wordIsBeingChecked = true;
  const letterInputsList = getCurrentRowInputsList();
  const lastInput = letterInputsList.item(letterInputsList.length - 1);

  if (Boolean(lastInput.getAttribute("value"))) {
    changeLoaderState(true);

    let playerWord = "";
    letterInputsList.forEach(
      input => (playerWord += input.getAttribute("value"))
    );

    const wordIsValid = await isWordValid(playerWord);

    if (wordIsValid) {
      const {
        winningWord,
        playerHasWon,
        matchingLetterIndexes,
        notMatchingLetterIndexes,
        closeLetterIndexes,
      } = await isWordAMatch(playerWord);

      highlightLetters({
        wordIsValid,
        matchingLetterIndexes,
        notMatchingLetterIndexes,
        closeLetterIndexes,
      });

      if (playerHasWon) {
        alert("You won !");
        gameIsOver = true;
      } else {
        const inputsRowsList = document.querySelectorAll(".inputs-row");

        if (currentRow < inputsRowsList.length - 1) {
          currentRow++;
          currentBox = 0;
        } else {
          alert(`You lost ! The word was: ${winningWord}`);
          gameIsOver = true;
        }
      }
    } else {
      highlightLetters({ wordIsValid });
    }
    changeLoaderState(false);
  }
  wordIsBeingChecked = false;
}

const letterInputs = document.querySelectorAll(".letter-input");
document.addEventListener("keydown", function ({ key }) {
  if (gameIsOver || wordIsBeingChecked) {
    return;
  }

  if (key === "Backspace") {
    removeLetterFromBox();
  } else if (isLetter(key)) {
    addLetterToBox(key);
  } else if (key === "Enter") {
    checkWord();
  }
});

document.querySelectorAll(".letter-input").forEach(input => {
  input.addEventListener("mousedown", function (event) {
    event.preventDefault();
  });
});