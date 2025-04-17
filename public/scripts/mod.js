import { db } from './firebase.js';
import { updateDisplay } from './uiRenderer.js';

let currentRoom = document.body.dataset.room;

function initModeratorPanel() {
  const ref = db.ref(`rooms/${currentRoom}/players`);
  ref.on("value", snapshot => {
    const players = snapshot.val() || {};
    const nextUpDiv = document.getElementById("nextUp");
    updateDisplay(players, null, nextUpDiv);
  });
}

function modSetStatus(name, status) {
  const updates = {
    active: status === "active" || status === "skip",
    skip: status === "skip",
  };
  db.ref(`rooms/${currentRoom}/players/${name}`).update(updates);
}

function modRemovePlayer(name) {
  db.ref(`rooms/${currentRoom}/players/${name}`).remove();
}

window.initModeratorPanel = initModeratorPanel;
window.modSetStatus = modSetStatus;
window.modRemovePlayer = modRemovePlayer;