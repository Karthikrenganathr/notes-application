import NoteManager from "../controller/noteManager.js";
const noteController = new NoteManager();

// CR: 1. Remove div or element name used in classnames
// 2. Avoid using inline styles. Use classlist instead
// 3. Better to keep close and create button spearately. Try to add toast wherever possible
export default class noteManagerView {
  async loadInitial() {
    const notesContainer = document.querySelector(".notes");
    let response = await fetch("../../src/pages/mainNotes/notes.html");
    let content = await response.text();
    window.pinnedCount = 0;
    notesContainer.innerHTML = content;
  }

  createNoteElement(title, description, id, orderId, isPinned) {
    const noteElement = document.createElement("div");
    noteElement.classList.add("note");
    noteElement.setAttribute("noteId", id);
    noteElement.setAttribute("orderId", orderId);
    noteElement.setAttribute("draggable", "true");
    noteElement.setAttribute("isPinned", isPinned);

    // CR: improper indentation. Add event listeners here instead of creating a new function to attach them.
    noteElement.innerHTML = `
        <div>
            <div class="note__heading">${title}</div>
            <div class="note__imgcontainer">
                <img src="./img/note/pin.svg" alt="unpin image" class="note__imgcontainer__img">
            </div>
        </div>
        <div class="note__mainnote"></div>
        <div class="note__options">
            <img src="./img/note/notification.svg" alt="alert image" class="note__options__img start">
            <img src="./img/note/contact.svg" alt="alert image" class="note__options__img">
            <img src="./img/note/themes.svg" alt="alert image" class="note__options__img">
            <img src="./img/note/photo.svg" alt="alert image" class="note__options__img">
            <img src="./img/note/archive.svg" id="archiveNote" alt="delete note" class="note__options__img">
            <img src="./img/note/more.svg" alt="alert image" class="note__options__img">
        </div>
    `;

    noteElement.querySelector(".note__mainnote").innerHTML = description;

    // Attach event listeners
    noteElement
      .querySelector(".note__mainnote")
      .addEventListener("click", () => this.enlargeView(id));

    noteElement.addEventListener("dragstart", noteController.handleDragStart);
    noteElement.addEventListener("dragenter", noteController.handleDragEnter);
    noteElement.addEventListener("dragover", noteController.handleDragOver);
    noteElement.addEventListener("dragleave", noteController.handleDragLeave);
    noteElement.addEventListener("drop", noteController.handleDrop);
    noteElement.addEventListener("dragend", noteController.handleDragEnd);

    if (isPinned) {
      if (window.pinnedCount === 0) {
        document.querySelector(".notes__pin").style.display = "inline-block";
      }
      let pinContainer = noteElement.querySelector(".note__imgcontainer__img");
      pinContainer.src = "./img/note/unpin.svg";
      const pinnedContainer = document.querySelector(".notes__pin__noteCon");
      pinnedContainer.prepend(noteElement);
      window.pinnedCount++;
    } else {
      const unpinnedContainer = document.querySelector(
        ".notes__unpin__noteCon"
      );
      unpinnedContainer.prepend(noteElement);
    }

    noteElement
      .querySelector(".note__imgcontainer__img")
      .addEventListener("click", noteController.bindUnpin.bind(null, id));

    // CR: Avoid using nth child for event binding; use proper class names
    noteElement
      .querySelector("#archiveNote")
      .addEventListener("click", noteController.archiveNote.bind(null, id));

    return noteElement;
  }

  createNote(title, description, result, isPinned) {
    console.log(isPinned);

    document.querySelector(
      ".notes__creatediv__content .notes__creatediv__content__enter"
    ).value = "";
    document.querySelector(
      ".notes__creatediv__titlediv .notes__creatediv__content__enter"
    ).value = "";

    const titleContainer = document.querySelector(
      ".notes__creatediv__titlediv"
    );
    const optionsContainer = document.querySelector(
      ".notes__creatediv__createOptionscon"
    );

    if (isPinned) {
      const pinImage = document.querySelector(
        ".notes__creatediv__titlediv__pinContainer__img"
      );
      pinImage.setAttribute("src", "../../img/note/pin.svg");
      pinImage.setAttribute("alt", "header pin");
      pinImage.setAttribute("data-ispinned", "false");
    }

    titleContainer.style.display = "none";
    optionsContainer.style.display = "none";

    this.createNoteElement(
      title,
      description,
      result.id,
      result.orderId,
      isPinned
    );
  }

  viewNote(notes) {
    notes.notes.forEach((note) => {
      // CR: move this to common logic and use for create notes too
      this.createNoteElement(
        note.title,
        note.text,
        note.id,
        note.orderId,
        note.isPinned
      );
    });
  }

  async enlargeView(id) {
    const response = await fetch("../../src/pages/mainNotes/englarge.html");
    const htmlText = await response.text();
    console.log(htmlText);
    document.body.insertAdjacentHTML("afterbegin", htmlText);
    noteController.closeNote();

    let noteItem = document.querySelector(`[noteId='${id}']`);
    let enlargedContainer = document.querySelector(".enlarged");
    let mainNoteContent = enlargedContainer.querySelector(
      ".enlarged__note__mainnote"
    );
    let existingEditor = mainNoteContent.querySelector(".ql-editor");

    const toolbarOptions = [
      [{ font: [] }],
      [{ header: [1, 2, 3] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
      ["blockquote", "code-block"],
      ["link", "image", "video"],
      [{ align: [] }],
    ];

    if (existingEditor) {
      document.querySelector(".ql-toolbar.ql-snow")?.remove();
    }

    mainNoteContent.innerHTML =
      noteItem.querySelector(".note__mainnote").innerHTML;
    enlargedContainer.querySelector(".enlarged__note__heading").textContent =
      noteItem.querySelector(".note__heading").textContent;

    enlargedContainer.setAttribute("noteId", id);
    enlargedContainer.style.display = "inline-block";

    new Quill(".enlarged__note__mainnote", {
      theme: "snow",
      modules: {
        toolbar: toolbarOptions,
      },
    });
  }

  async restoreMain() {
    const notesContainer = document.querySelector(".notes");
    let response = await fetch("../../src/pages/mainNotes/notes.html");
    let content = await response.text();
    window.pinnedCount = 0;
    notesContainer.innerHTML = content;
    await noteController.viewNote();
    noteController.saveNote();
    noteController.closeNote();
  }
}
