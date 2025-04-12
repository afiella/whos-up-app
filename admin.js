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

const rooms = ["BH", "59"];
const snapshots = {};
const reorderMode = {};

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("adminPassword").value.trim();
  if (input === "afia") {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    rooms.forEach((room) => {
      listenToRoom(room);
    });
  } else {
    alert("Incorrect password.");
  }
});

function listenToRoom(room) {
  const refPath = ref(db, `rooms/${room}/players`);
  onValue(refPath, (snapshot) => {
    snapshots[room] = snapshot.val() || {};
    displayRoom(room, snapshots[room]);
  });
}

function displayRoom(room, playersData) {
  const wrapper = document.getElementById(`room-${room}`);
  const list = wrapper.querySelector(".playerList");
  const nextUp = wrapper.querySelector(".nextUp");

  const entries = Object.entries(playersData).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const active = entries.filter(([_, p]) => p.active && !p.skip);
  const currentUp = active[0]?.[0];
  nextUp.textContent = currentUp ? `Next Up: ${currentUp}` : "";

  list.innerHTML = "";

  entries.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = "bg-white rounded shadow px-4 py-3 draggable mb-2";
    div.setAttribute("draggable", reorderMode[room]);
    div.dataset.key = key;
    div.dataset.room = room;

    let status = "Active", badge = "bg-green-500";
    if (player.skip) { status = "With Customer"; badge = "bg-yellow-500"; }
    else if (!player.active) { status = "Out"; badge = "bg-red-500"; }

    div.innerHTML = `
      <div class="flex items-center justify-between cursor-pointer player-header">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full" style="background-color: ${player.color}"></span>
          <span class="font-semibold">${player.name}</span>
        </div>
        <span class="text-sm text-white px-2 py-1 rounded ${badge}">${status}</span>
      </div>
      <div class="action-buttons mt-2 flex gap-1">
        <button onclick="window.setStatus('${room}', '${key}', 'active')" class="text-xs bg-green-600 text-white px-2 rounded">In</button>
        <button onclick="window.setStatus('${room}', '${key}', 'skip')" class="text-xs bg-yellow-500 text-white px-2 rounded">With Customer</button>
        <button onclick="window.setStatus('${room}', '${key}', 'inactive')" class="text-xs bg-gray-500 text-white px-2 rounded">Out</button>
        <button onclick="window.removePlayer('${room}', '${key}')" class="text-xs text-red-600 font-bold">✕</button>
      </div>
    `;

    if (reorderMode[room]) {
      div.classList.add("border", "border-blue-300");
      div.addEventListener("dragstart", handleDragStart);
      div.addEventListener("dragover", handleDragOver);
      div.addEventListener("drop", handleDrop);
      div.addEventListener("dragend", handleDragEnd);
    }

    list.appendChild(div);
  });
}

// Drag and reorder logic
let dragKey = null, dragRoom = null;
function handleDragStart(e) {
  dragKey = this.dataset.key;
  dragRoom = this.dataset.room;
  this.classList.add("opacity-50");
}

function handleDragOver(e) {
  e.preventDefault();
  this.classList.add("bg-blue-100");
}

function handleDrop() {
  this.classList.remove("bg-blue-100");
  const targetKey = this.dataset.key;
  reorderPlayers(dragRoom, dragKey, targetKey);
}

function handleDragEnd() {
  document.querySelectorAll(".draggable").forEach(el => el.classList.remove("opacity-50", "bg-blue-100"));
  dragKey = null;
  dragRoom = null;
}

function reorderPlayers(room, fromKey, toKey) {
  const players = Object.entries(snapshots[room]).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const fromIdx = players.findIndex(([k]) => k === fromKey);
  const toIdx = players.findIndex(([k]) => k === toKey);

  if (fromIdx === -1 || toIdx === -1) return;
  const [moved] = players.splice(fromIdx, 1);
  players.splice(toIdx, 0, moved);

  const updates = {};
  const now = Date.now();
  players.forEach(([k, p], i) => {
    updates[k] = { ...p, joinedAt: now + i };
  });

  set(ref(db, `rooms/${room}/players`), updates);
}

window.setStatus = function (room, key, status) {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  const updates = status === "active"
    ? { active: true, skip: false, joinedAt: Date.now() }
    : status === "skip"
    ? { active: true, skip: true, joinedAt: Date.now() }
    : { active: false, skip: false };
  update(playerRef, updates);
};

window.removePlayer = function (room, key) {
  remove(ref(db, `rooms/${room}/players/${key}`));
};

window.toggleReorder = function (room) {
  reorderMode[room] = !reorderMode[room];
  displayRoom(room, snapshots[room]);
};
