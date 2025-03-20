import * as model from "../model/model.js";
import { showToast, highlightCurrentPage } from "../commanLogic.js";
let noteView;
let draggedNote = null,
  searchResultsCache = null,
  startOrderId = null,
  startContainerClass = null;
// CR: Move all event binding to places where the elements are created
import("/src/views/noteManager.js").then((module) => {
  noteView = new module.default();
});
let notesList = [];
export default class noteManagerController {
  saveNote() {
    document
      .querySelector(".notes__creatediv__createOptionscon__savecon")
      .addEventListener("click", async () => {
        let noteContent = document.querySelector(
          ".notes__creatediv__content .notes__creatediv__content__enter"
        ).value;
        let noteTitle = document.querySelector(
          ".notes__creatediv__titlediv .notes__creatediv__content__enter"
        ).value;
        let isPinned =
          document
            .querySelector(".notes__creatediv__titlediv__pinContainer__img")
            .getAttribute("data-ispinned") === "true";
        let result = await model.storeNotes(noteTitle, noteContent, isPinned);
        noteView.createNote(noteTitle, noteContent, result, isPinned);
        showToast("Note Created");
      });
  }

  async viewNote() {
    let userNotes = await model.getNotes();
    noteView.viewNote(userNotes);
  }

  closeNote() {
    document
      .querySelector(".enlarged__note__options__close")
      .addEventListener("click", async () => {
        let enlargedNote = document.querySelector(".enlarged");
        let headingElement = enlargedNote.querySelector(
          ".enlarged__note__heading"
        );
        let mainContentElement = enlargedNote.querySelector(
          ".enlarged__note__mainnote"
        );
        let noteTitle = headingElement.textContent;
        let noteContent = enlargedNote.querySelector(".ql-editor").innerHTML;
        let noteId = enlargedNote.getAttribute("noteId");
        let isTitleEdited = headingElement.dataset.isclicked === "true";
        let isContentEdited = mainContentElement.dataset.isclicked === "true";
        let result;
        if (isTitleEdited && isContentEdited) {
          result = await model.updateNotes(noteTitle, noteContent, noteId);
        } else if (isTitleEdited) {
          result = await model.updateNotes(noteTitle, null, noteId);
        } else if (isContentEdited) {
          result = await model.updateNotes(null, noteContent, noteId);
        }
        let selectedNote = document.querySelector(`.note[noteId="${noteId}"]`);
        selectedNote.querySelector(".note__mainnote").innerHTML = noteContent;
        selectedNote.querySelector(".note__heading").textContent =
          headingElement.textContent;
        headingElement.dataset.isclicked = "false";
        mainContentElement.dataset.isclicked = "false";
        enlargedNote.remove();
      });
  }

  async archiveNote(id) {
    let noteItem = document.querySelector(`[noteid='${id}']`);
    let isPinned = noteItem.getAttribute("isPinned") === "true";
    if (isPinned) {
      window.pinnedCount--;
      if (window.pinnedCount === 0) {
        document.querySelector(".notes__pin").style.display = "none";
      }
    }
    let result = await model.archiveNote(id);
    noteItem.remove();
    console.log("remove");
    showToast("Note Removed");
  }

  // CR: Create single function for pinning and unpinning a note. use data attr to identify states
  async bindUnpin(id) {
    let noteItem = document.querySelector(`[noteId='${id}']`);
    let noteImage = noteItem.querySelector(".note__imgcontainer__img");
    let isPinned = noteItem.getAttribute("ispinned") === "true";
    let result = await model.pinUnpinNode(id, !isPinned);
    noteItem.setAttribute("orderId", result.orderId);
    if (!isPinned) {
      if (window.pinnedCount === 0) {
        document.querySelector(".notes__pin").style.display = "inline-block";
      }
      window.pinnedCount++;
      noteImage.src = "../../img/note/unpin.svg";
      noteImage.alt = "pin image";
      document.querySelector(".notes__pin__noteCon").prepend(noteItem);
    } else {
      window.pinnedCount--;
      if (window.pinnedCount === 0) {
        document.querySelector(".notes__pin").style.display = "none";
      }
      noteImage.src = "../../img/note/pin.svg";
      noteImage.alt = "unpin image";
      document.querySelector(".notes__unpin__noteCon").prepend(noteItem);
    }
    noteItem.setAttribute("ispinned", !isPinned);
  }

  async MainPage() {
    // CR: 1. Remove all inline Style, attach class and handle styles in CSS
    // not able to get below query
    // 2. Don't use nth element to query page. Why current page needs to maintain?

    const mainButton = document.querySelector("#mainpage_navigation");
    mainButton.addEventListener("click", async function () {
      if (window.currentPage !== "mainPage") {
        if (!navigator.onLine) {
          alert("You are offline, cannot switch page");
          return;
        }
        highlightCurrentPage(
          mainButton,
          document.querySelector("#trashpage_navigation")
        );
        noteView.restoreMain();
        window.currentPage = "mainPage";
      }
    });
  }

  search() {
    function debounce(func, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    }

    function getNotes() {
      return Array.from(document.querySelectorAll(".note")).map((note) => ({
        id: note.getAttribute("noteId"),
        titleWords: note
          .querySelector(".note__heading")
          .textContent.toLowerCase()
          .split(" "),
        textWords: note
          .querySelector(".note__mainnote")
          .textContent.toLowerCase()
          .split(" "),
      }));
    }

    async function searchNotesParallel(notesList, searchWords) {
      return Promise.allSettled(
        notesList.map((note) => searchSingleNote(note, searchWords))
      ).then((results) =>
        results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value)
      );
    }

    function searchSingleNote(note, searchWords) {
      return new Promise((resolve) => {
        if (!searchResultsCache) searchResultsCache = {};
        let cachedResult = searchResultsCache[note.id] || {
          trueSearchWords: [],
          falseSearchWords: [],
        };

        if (
          searchWords.some((word) =>
            cachedResult.falseSearchWords.includes(word)
          )
        ) {
          resolve({
            noteId: note.id,
            trueSearchWords: cachedResult.trueSearchWords,
            falseSearchWords: cachedResult.falseSearchWords,
            isMatch: false,
          });
          return;
        }

        let newTrueSearchWords = [];
        let newFalseSearchWords = [];
        let wordsToCheck = searchWords.filter(
          (word) =>
            !cachedResult.trueSearchWords.includes(word) &&
            !cachedResult.falseSearchWords.includes(word)
        );

        wordsToCheck.forEach((word) => {
          if (
            note.titleWords.some((titleWord) => titleWord.includes(word)) ||
            note.textWords.some((textWord) => textWord.includes(word))
          ) {
            newTrueSearchWords.push(word);
          } else {
            newFalseSearchWords.push(word);
          }
        });

        let finalTrueSearchWords = [
          ...cachedResult.trueSearchWords.filter((word) =>
            searchWords.includes(word)
          ),
          ...newTrueSearchWords,
        ];
        let finalFalseSearchWords = [
          ...cachedResult.falseSearchWords.filter((word) =>
            searchWords.includes(word)
          ),
          ...newFalseSearchWords,
        ];

        let isMatch = finalFalseSearchWords.length === 0;

        searchResultsCache[note.id] = {
          trueSearchWords: finalTrueSearchWords,
          falseSearchWords: finalFalseSearchWords,
          isMatch: isMatch,
        };

        resolve({
          noteId: note.id,
          trueSearchWords: finalTrueSearchWords,
          falseSearchWords: finalFalseSearchWords,
          isMatch: isMatch,
        });
      });
    }

    async function handleSearch(event) {
      const searchText = event.target.value.trim();
      if (!Array.isArray(notesList) || notesList.length === 0) {
        notesList = getNotes();
        console.log(notesList);
      }

      let results = await searchNotesParallel(notesList, searchText.split(" "));
      console.log("Search Results:", results);

      let matchCount = 0;
      let noMatchElement = document.querySelector(".noMatch");
      if (noMatchElement) noMatchElement.remove();

      results.forEach((result) => {
        let noteElement = document.querySelector(
          `.note[noteid='${result.noteId}']`
        );
        if (noteElement) {
          noteElement.style.display = result.isMatch ? "inline-block" : "none";
          if (result.isMatch) matchCount++;
        }
      });

      if (matchCount === 0) {
        const notesContainer = document.querySelector(".notes__unpin__noteCon");
        const noMatchDiv = document.createElement("div");
        noMatchDiv.classList.add("noMatch");
        noMatchDiv.textContent = "No match found";
        notesContainer.appendChild(noMatchDiv);
      }

      if (searchText === "") {
        notesList = [];
      }
    }

    const searchInput = document.querySelector(
      ".header__searchContainer__search"
    );
    searchInput.addEventListener("input", debounce(handleSearch, 500));
  }

  handleDragStart(e) {
    this.style.opacity = "0.4";
    draggedNote = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", this.getAttribute("noteId"));
    startOrderId = this.getAttribute("orderId");
    startContainerClass = this.parentElement.className;
  }

  handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    return false;
  }

  handleDragEnter(e) {
    this.classList.add("dragover");
  }

  handleDragLeave(e) {
    this.classList.remove("dragover");
  }

  async handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    let noteId = e.dataTransfer.getData("text/plain");
    let droppedNote = document.querySelector(`.note[noteId="${noteId}"]`);

    if (draggedNote !== this) {
      let sourceContainer = draggedNote.parentElement;
      let targetContainer = this.parentElement;
      if (sourceContainer !== targetContainer) return false;

      if (targetContainer && draggedNote) {
        let targetOrderId = this.getAttribute("orderId");
        let targetContainerClass = this.parentElement.className;

        let result;
        if (startContainerClass === "notes__pin__noteCon") {
          result = await model.reorder(startOrderId, targetOrderId, true);
        } else {
          result = await model.reorder(startOrderId, targetOrderId, false);
        }

        if (result.success) {
          console.log("Reorder result:", result);
          document.querySelector(`.${targetContainerClass}`).innerHTML = "";
          window.pinnedCount = 0;
          noteView.viewNote(result);
        }
      }
    }
    return false;
  }

  handleDragEnd(e) {
    this.style.opacity = "1";
    document.querySelectorAll(".note").forEach((note) => {
      note.classList.remove("dragover");
    });
    draggedNote = null;
    startOrderId = null;
    startContainerClass = null;
  }
}
