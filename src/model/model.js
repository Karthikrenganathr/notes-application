import { SERVER_URL } from "../../mocks/handlers";
let defaultCreateIndex = 1000;
// CR: Error handling is not handled for api failures
export async function storeNotes(title, description, isPinned) {
  try {
    if (!navigator.onLine) {
      console.log("offine");
      let note = { title: title, text: description, isPinned: isPinned };
      // CR: why defaultCreateIndex is created in global level? what this var means and why it is decremented?
      localStorage.setItem(defaultCreateIndex, JSON.stringify(note));
      defaultCreateIndex++;
      return { success: true, id: defaultCreateIndex - 1 };
    } else {
      let response = await fetch(`${SERVER_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify({
          title: title,
          text: description,
          isPinned: isPinned,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed with status code: ${response.status}`);
      }
      let result = await response.json();
      return result;
    }
  } catch (error) {
    showToast(`Failed to store note: ${error.message}`);
    return { success: false, error: error.message };
  }
}
export async function getNotes() {
  try {
    let response = await fetch(`${SERVER_URL}/notes?category=mainNote`);
    if (!response.ok) {
      throw new Error(`Failed with status code: ${response.status}`);
    }
    let result = await response.json();
    return result;
  } catch (error) {
    showToast(`Failed to fetch notes: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function updateOfflineChanges(id, newNode) {
  let existingNote = localStorage.getItem(id);
  let note = existingNote ? JSON.parse(existingNote) : {};
  for (let key of Object.keys(newNode)) {
    note[key] = newNode[key];
  }
  localStorage.setItem(id, JSON.stringify(note));
  return { success: true };
}
// CR: In offline case, you have checked existing note is present and updating, when will you clear the localstorage?
// why we are always updating title and text, what if they update only title
export async function updateNotes(title, text, id) {
  try {
    console.log(id);
    if (!navigator.onLine) {
      let newnode = { title: title, text: text };
      return updateOfflineChanges(id, newnode);
    } else {
      const response = await fetch(`${SERVER_URL}/notes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          text: text,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed with status code: ${response.status}`);
      }
      const result = await response.json();
      return result;
    }
  } catch (error) {
    showToast(`Failed to update note: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function archiveNote(id) {
  try {
    console.log(id);
    if (!navigator.onLine) {
      let newnode = { category: "trash", isPinned: false };
      // CR: repeatative code for Checking existingnode and update. you can make it as function
      return updateOfflineChanges(id, newnode);
    } else {
      const response = await fetch(`${SERVER_URL}/notes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "trash",
          isPinned: false,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed with status code: ${response.status}`);
      }
      const result = await response.json();
      return result;
    }
  } catch (error) {
    showToast(`Failed to archive note: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function pinUnpinNode(id, status) {
  try {
    console.log(id, status);
    if (!navigator.onLine) {
      let newnode = { isPinned: status };
      return updateOfflineChanges(id, newnode);
    } else {
      const response = await fetch(`${SERVER_URL}/notes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPinned: status,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed with status code: ${response.status}`);
      }
      const result = await response.json();
      return result;
    }
  } catch (error) {
    showToast(`Failed to update pin status: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function trashNotes() {
  try {
    let response = await fetch(`${SERVER_URL}/notes?category=trash`);
    if (!response.ok) {
      throw new Error(`Failed with status code: ${response.status}`);
    }
    let result = await response.json();
    return result;
  } catch (error) {
    showToast(`Failed to fetch trash notes: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function permDelete(id) {
  try {
    if (!navigator.onLine) {
      localStorage.setItem(id, JSON.stringify({}));
    } else {
      let response = await fetch(`${SERVER_URL}/notes/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed with status code: ${response.status}`);
      }
      let result = await response.json();
      return result;
    }
  } catch (error) {
    showToast(`Failed to delete note: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function restoreNote(id) {
  try {
    if (!navigator.onLine) {
      let newnode = { category: "mainNote" };
      return updateOfflineChanges(id, newnode);
    }
    const response = await fetch(`${SERVER_URL}/notes/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: "mainNote",
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed with status code: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    showToast(`Failed to restore note: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function syncOfflineNotes() {
  console.log("online");
  if (!navigator.onLine) return;
  let notesArray = [];
  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    let storedData = localStorage.getItem(key);
    let parsedData = JSON.parse(storedData);
    notesArray.push({ [key]: parsedData });
  }
  if (notesArray.length > 0) {
    try {
      let response = await fetch(`${SERVER_URL}/notes/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesArray }),
      });
      if (!response.ok) {
        throw new Error(`Failed with status code: ${response.status}`);
      }
      let result = await response.json();
      if (result.success) {
        localStorage.clear();
        let updateValue = result.updateId;
        updateValue.forEach((noteObj) => {
          let id = parseInt(Object.keys(noteObj)[0], 10);
          let orginalId = noteObj[id];
          console.log(id, orginalId);
          let noteElement = document.querySelector(`[noteId="${id}"]`);
          console.log(noteElement);
          if (noteElement) {
            noteElement.setAttribute("noteId", orginalId);
          }
        });
      }
    } catch (error) {
      showToast(`Failed to sync notes: ${error.message}`);
    }
  }
}

export async function reorder(initial, final, isPin) {
  try {
    const url = `${SERVER_URL}/notes/reorder?initial=${initial}&final=${final}&ispin=${isPin}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    showToast(`Failed to Reorder Note: ${error.message}`);
    return null;
  }
}
