export default class archiveView {
  constructor() {
    import("/src/controller/archiveController.js").then((module) => {
      this.archiveManager = new module.default();
    });
  }

  viewArchive(archiveNotes) {
    console.log("check", archiveNotes);
    let archiveContainer = document.querySelector(".notes__archive__noteCon");
    archiveContainer.innerHTML = "";
    archiveNotes.notes.forEach((note) => {
      const newNote = this.createNote(note.title, note.text, note.id);
      archiveContainer.prepend(newNote);
    });
  }

  createNote(title, description, id) {
    const noteItem = document.createElement("div");
    noteItem.classList.add("note");
    noteItem.setAttribute("noteId", id);
    noteItem.innerHTML = `
          <div>
              <div class="note__heading">${title}</div>
          </div>
          <div class="note__mainnote"></div>
          <div class="note__options">
              <img src="../../img/delete notes/permanet delete.svg" id="permDelete" alt="permanent delete" class="note__options__img start">
              <img src="../../img/delete notes/reestore.svg" alt="restore" id="restore" class="note__options__img">
          </div>
      `;
    noteItem.querySelector(".note__mainnote").innerHTML = description;
    // CR: don't use nth child to get element
    noteItem
      .querySelector("#permDelete")
      .addEventListener(
        "click",
        this.archiveManager.permanentDelte.bind(this.archiveManager, id)
      );
    noteItem
      .querySelector("#restore")
      .addEventListener(
        "click",
        this.archiveManager.restore.bind(this.archiveManager, id)
      );
    return noteItem;
  }
}
