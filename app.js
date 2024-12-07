async function init() {
  function isLetter(character) {
    return /^[a-zA-Z]$/.test(character);
  }

  let currentRow = 0;
  let currentBox = 0;
  let gameIsOver = false;
  let wordIsBeingChecked = false;

  const winningWordPromise = await fetch(
    "https://words.dev-apis.com/word-of-the-day"
  );
  const { word: winningWord } = await winningWordPromise.json();

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

  function removeLetterFromBox() {
    const inputsList = getCurrentRowInputsList();
    const lastInput = inputsList.item(inputsList.length - 1);

    if (currentBox === 0 || Boolean(lastInput.getAttribute("value"))) {
      inputsList.item(currentBox).setAttribute("value", "");
    } else {
      currentBox--;
      inputsList.item(currentBox).setAttribute("value", "");
    }
  }

  function addLetterToBox(letter) {
    const letterInputsList = getCurrentRowInputsList();
    const currentInputHtmlElement = letterInputsList.item(currentBox);

    currentInputHtmlElement.setAttribute("value", letter.toUpperCase());

    if (currentBox < letterInputsList.length - 1) {
      currentBox++;
    }
  }

  async function isWordValid(word) {
    const promise = await fetch("https://words.dev-apis.com/validate-word", {
      method: "POST",
      body: JSON.stringify({ word }),
    });

    const payload = await promise.json();

    return payload.validWord;
  }

  function isLetterInWord({
    winningWord,
    playerWord,
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

  function isWordAMatch(playerWord) {
    let matchingLetterIndexes = [];
    let notMatchingLetterIndexes = [];
    let closeLetterIndexes = [];

    const normalizedPlayerWord = playerWord.toUpperCase();
    const normalizedWinningWord = winningWord.toUpperCase();

    for (let i = 0; i < normalizedWinningWord.length; i++) {
      if (normalizedPlayerWord[i] === normalizedWinningWord[i]) {
        matchingLetterIndexes.push(i);
      }
    }

    for (let i = 0; i < normalizedWinningWord.length; i++) {
      if (
        isLetterInWord({
          playerWord: normalizedPlayerWord,
          winningWord: normalizedWinningWord,
          letter: normalizedPlayerWord[i],
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
          playerHasWon,
          matchingLetterIndexes,
          notMatchingLetterIndexes,
          closeLetterIndexes,
        } = isWordAMatch(playerWord);

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
}

init();
