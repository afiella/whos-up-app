import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkEKUzUhc-nKFLnF1w0MOm6qwpKHTpfaI",
  authDomain: "who-s-up-app.firebaseapp.com",
  databaseURL: "https://who-s-up-app-default-rtdb.firebaseio.com",
  projectId: "who-s-up-app",
  storageBucket: "who-s-up-app.appspot.com",
  messagingSenderId: "167292375113",
  appId: "1:167292375113:web:ce718a1aab4852fe5daf98"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentRoom = "BH";
let reorderMode = false;
let latestSnapshot = {};

const roomTitle = document.getElementById("roomTitle");
const playerList = document.getElementById("playerList");
const reorderToggle = document.getElementById("reorderToggle");
const currentNextUp = document.getElementById("currentNextUp");

window.checkPassword = function () {
  const input = document.getElementById("adminPassword").value.trim();
  if (input === "bhmod") {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    roomTitle.textContent = "Room: BH";
    loadRoom();
  } else {
    alert("Incorrect password.");
  }
};

function loadRoom() {
  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(playersRef, (snapshot) => {
    latestSnapshot = snapshot.val() || {};
    displayPlayers(latestSnapshot);
  });
}

function displayPlayers(data) {
  const players = Object.entries(data).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const activePlayers = players.filter(([_, p]) => p.active && !p.skip);
  const nextPlayer = activePlayers[0]?.[0];

  currentNextUp.textContent = nextPlayer ? `Currently Up: ${nextPlayer}` : "No one is currently up.";
  playerList.innerHTML = "";

  players.forEach(([key, player]) => {
    let status = "Active";
    let badgeColor = "bg-green-500";
    if (!player.active) {
      status = "Out";
      badgeColor = "bg-red-500";
    } else if (player.skip) {
      status = "With Customer";
      badgeColor = "bg-yellow-500";
    }

    const div = document.createElement("div");
    div.className = "bg-white p-3 rounded shadow";
    div.draggable = reorderMode;
    div.dataset.key = key;

    div.innerHTML = `
      <div class="flex items-center justify-between cursor-pointer player-header">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full" style="background-color: ${player.color}"></span>
          <span class="font-semibold">${player.name}</span>
          <span class="text-xs px-2 py-1 rounded text-white ${badgeColor}">${status}</span>
          ${
            key === nextPlayer
              ? '<span class="ml-2 text-sm text-blue-600 font-bold">(Up Now)</span>'
              : ""
          }
        </div>
      </div>
      <div class="action-buttons mt-3 space-y-2">
        <div class="flex justify-between">
          <button onclick="setStatus('${key}', 'active')" class="bg-green-500 text-white px-2 py-1 rounded text-sm w-full mr-1">In</button>
          <button onclick="setStatus('${key}', 'skip')" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm w-full mx-1">With Customer</button>
          <button onclick="setStatus('${key}', 'inactive')" class="bg-gray-500 text-white px-2 py-1 rounded text-sm w-full ml-1">Out</button>
        </div>
        <div class="text-center">
          <button onclick="removePlayer('${key}')" class="text-red-600 text-sm font-bold">✕ Remove</button>
        </div>
      </div>
    `;

    div.querySelector('.player-header').addEventListener("click", () => {
      div.classList.toggle("expanded");
    });

    // Drag-and-drop reorder logic
    if (reorderMode) {
      div.addEventListener("dragstart", handleDragStart);
      div.addEventListener("dragover", handleDragOver);
      div.addEventListener("drop", handleDrop);
      div.addEventListener("dragenter", handleDragEnter);
      div.addEventListener("dragleave", handleDragLeave);
      div.addEventListener("dragend", handleDragEnd);
    }

    playerList.appendChild(div);
  });
}

window.setStatus = function (key, type) {
  const player = latestSnapshot[key];
  if (!player) return;
  let updates = {};
  if (type === "active") {
    updates = { active: true, skip: false, joinedAt: Date.now() };
  } else if (type === "skip") {
    updates = { active: true, skip: true, joinedAt: Date.now() };
  } else {
    updates = { active: false, skip: false };
  }
  const playerRef = ref(db, `rooms/${currentRoom}/players/${key}`);
  update(playerRef, updates);
};

window.removePlayer = function (key) {
  const playerRef = ref(db, `rooms/${currentRoom}/players/${key}`);
  remove(playerRef);
};

window.toggleReorderMode = function () {
  reorderMode = !reorderMode;
  document.getElementById("reorderToggle").textContent = reorderMode
    ? "Finish Reordering"
    : "Enable Reorder Mode";
  displayPlayers(latestSnapshot);
};

// Drag & Drop logic
let dragSrcEl = null;

function handleDragStart(e) {
  dragSrcEl = this;
  this.classList.add("dragging");
}

function handleDragOver(e) {
  e.preventDefault();
  return false;
}

function handleDrop(e) {
  e.stopPropagation();
  const children = Array.from(playerList.children);
  const srcIndex = children.indexOf(dragSrcEl);
  const targetIndex = children.indexOf(this);

  if (srcIndex !== -1 && targetIndex !== -1 && srcIndex !== targetIndex) {
    const entries = Object.entries(latestSnapshot).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
    const dragged = entries[srcIndex];
    entries.splice(srcIndex, 1);
    entries.splice(targetIndex, 0, dragged);

    const now = Date.now();
    entries.forEach(([key, val], i) => {
      val.joinedAt = now + i;
    });

    const updates = Object.fromEntries(entries);
    set(ref(db, `rooms/${currentRoom}/players`), updates);
  }

  return false;
}

function handleDragEnter() {
  this.classList.add("drag-over");
}
function handleDragLeave() {
  this.classList.remove("drag-over");
}
function handleDragEnd() {
  this.classList.remove("dragging");
}
