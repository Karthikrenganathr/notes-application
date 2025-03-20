import * as model from "../model/model.js";
import ArchiveView from "../views/archiveView.js";
import { showToast, highlightCurrentPage } from "../commanLogic.js";
const archiveView = new ArchiveView();
export default class archiveController {
  // CR: bind events in html, Dont use nth selector for getting archive element
  archiveSection() {
    console.log("HI");
    const archiveButton = document.querySelector("#trashpage_navigation");
    // CR: Code seems similar to notes controller main page onClickButton, check if can be moved to common
    archiveButton.addEventListener("click", async function () {
      if (window.currentPage !== "trash") {
        if (!navigator.onLine) {
          alert("You are offline cannt switch page");
          return;
        }
        highlightCurrentPage(
          archiveButton,
          document.querySelector("#mainpage_navigation")
        );
        const notesContainer = document.querySelector(".notes");
        let response = await fetch("../../src/pages/archive/archive.html");
        let content = await response.text();
        notesContainer.innerHTML = content;
        let deleteNote = await model.trashNotes();
        console.log("delete", deleteNote);
        archiveView.viewArchive(deleteNote);
        window.currentPage = "trash";
      }
    });
  }

  async permanentDelte(id) {
    let noteItem = document.querySelector(`[noteId='${id}']`);
    if (noteItem) {
      let result = await model.permDelete(id);
      noteItem.remove();
      showToast("Permanently Deleted");
    }
  }

  async restore(id) {
    let noteItem = document.querySelector(`[noteId='${id}']`);
    if (noteItem) {
      let result = await model.restoreNote(id);
      noteItem.remove();
      showToast("Notes Restored");
    }
  }
}
