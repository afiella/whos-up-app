import { db } from './firebase.js';
import { updateDisplay } from './uiRenderer.js';

let currentRoom = "BH"; // Admin sees all rooms by default

function loadRoom(roomName) {
  const roomRef = db.ref(`rooms/${roomName}/players`);
  roomRef.on("value", snapshot => {
    const players = snapshot.val() || {};
    const container = document.getElementById(`${roomName.toLowerCase()}RoomContainer`);
    const nextUpDiv = document.getElementById(`${roomName.toLowerCase()}NextUp`);
    updateDisplay(players, null, nextUpDiv);
  });
}

function removePlayer(room, name) {
  db.ref(`rooms/${room}/players/${name}`).remove();
}

function setPlayerStatus(room, name, status) {
  const updates = {
    active: status === "active" || status === "skip",
    skip: status === "skip",
  };
  db.ref(`rooms/${room}/players/${name}`).update(updates);
}

window.loadRoom = loadRoom;
window.removePlayer = removePlayer;
window.setPlayerStatus = setPlayerStatus;