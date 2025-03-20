import { SERVER_URL } from "../mocks/handlers.js";
import { worker } from "../mocks/server.js";
import NoteView from "./views/noteManager.js";
import NoteController from "./controller/noteManager.js";
import ArchiveController from "./controller/archiveController.js";
import * as model from "./model/model.js";
const noteView = new NoteView();
const noteController = new NoteController();
const archiveController = new ArchiveController();
// CR: 1. Don't pollute window object
// 2. indendation is not proper in few places and coding guidliness not met like space after ','
// ,remove unused code, please check it using any tools

window.pinnedCount = 0;
window.currentPage = "mainPage";
async function enableMocking() {
  console.log("calling mock");
  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  console.log(worker);
  return worker.start();
}
// CR: Remove this function, set data in mock server (notes[])
export async function LoadData() {
  const response = await fetch(`${SERVER_URL}/notes`, {
    method: "POST",
    body: JSON.stringify({
      title: "Hi",
      text: "Welcome to ZoomRX",
      isPinned: false,
    }),
  });
  const response1 = await fetch(`${SERVER_URL}/notes`, {
    method: "POST",
    body: JSON.stringify({
      title: "Welcome",
      text: "to Javascript",
      isPinned: false,
    }),
  });
  const response2 = await fetch(`${SERVER_URL}/notes`, {
    method: "POST",
    body: JSON.stringify({
      title: "test",
      text: "view",
      isPinned: true,
    }),
  });
}
/*function clearAllNotes() {
    Object.keys(localStorage).forEach((key) => {
            localStorage.removeItem(key);
    });
}*/
//clearAllNotes();
enableMocking().then(() => {
  console.log("Mocking enabled!");
  // CR: why onlclickbutton event trigged?
  noteView.loadInitial().then(() => {
    LoadData().then(() => {
      window.addEventListener("online", model.syncOfflineNotes);
      //noteView.expandTitle();
      //noteView.headerPinUnpin();
      //noteView.clickEditHeader();
      noteController.viewNote();
      noteController.saveNote();
      //noteController.closeNote();
      //archiveController.archiveSection();
      noteController.MainPage();
      noteController.search();
      archiveController.archiveSection();
    });
  });
});
