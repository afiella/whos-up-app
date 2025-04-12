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
  appId: "1:167292375113:web:ce718a1aab4852fe5daf98",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentRoom = null;
let reorderMode = false;
let latestSnapshot = {};

const loginSection = document.getElementById("loginSection");
const adminPanel = document.getElementById("adminPanel");
const roomTitle = document.getElementById("roomTitle");
const playerList = document.getElementById("playerList");
const reorderToggle = document.getElementById("reorderToggle");
const currentNextUp = document.getElementById("currentNextUp");

window.checkPassword = function () {
  const password = document.getElementById("adminPassword").value.trim().toLowerCase();
  if (password === "bhmod") {
    currentRoom = "BH";
  } else if (password === "59mod") {
    currentRoom = "59";
  } else {
    alert("Incorrect password");
    return;
  }

  loginSection.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  roomTitle.textContent = `Room: ${currentRoom}`;
  reorderToggle.classList.remove("hidden");
  listenToRoom();
};

function listenToRoom() {
  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(playersRef, (snapshot) => {
    latestSnapshot = snapshot.val() || {};
    renderPlayers();
  });
}

function renderPlayers() {
  const entries = Object.entries(latestSnapshot).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt
  );

  const active = entries.filter(([_, p]) => p.active && !p.skip);
  const nextUp = active[0]?.[0] || null;
  currentNextUp.textContent = nextUp ? `Next Up: ${nextUp}` : "";

  playerList.innerHTML = "";
  entries.forEach(([key, player], index) => {
    const status = player.skip
      ? "With Customer"
      : !player.active
      ? "Out of Rotation"
      : "Active";

    const badge = player.skip
      ? "bg-yellow-500"
      : !player.active
      ? "bg-gray-500"
      : "bg-green-500";

    const div = document.createElement("div");
    div.className =
      "bg-white rounded shadow px-4 py-3 flex flex-col gap-2 draggable";
    div.setAttribute("draggable", reorderMode);
    div.dataset.key = key;

    div.innerHTML = `
      <div class="flex items-center justify-between cursor-pointer player-header">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full" style="background-color: ${player.color}"></span>
          <span class="font-semibold">${player.name}</span>
        </div>
        <span class="text-sm text-white px-2 py-1 rounded ${badge}">${status}</span>
      </div>
      <div class="action-buttons mt-2 space-y-1">
        <div class="flex gap-2">
          <button onclick="setPlayerStatus('${key}', 'active')" class="bg-green-600 text-white px-2 py-1 rounded text-xs w-full">In</button>
          <button onclick="setPlayerStatus('${key}', 'skip')" class="bg-yellow-500 text-white px-2 py-1 rounded text-xs w-full">With Customer</button>
          <button onclick="setPlayerStatus('${key}', 'inactive')" class="bg-gray-500 text-white px-2 py-1 rounded text-xs w-full">Out</button>
        </div>
        <button onclick="removePlayer('${key}')" class="text-red-600 text-sm font-semibold">✕ Remove</button>
      </div>
    `;

    // Toggle buttons on tap
    div.querySelector(".player-header").addEventListener("click", () => {
      div.classList.toggle("expanded");
    });

    // Drag events
    if (reorderMode) {
      div.addEventListener("dragstart", handleDragStart);
      div.addEventListener("dragover", handleDragOver);
      div.addEventListener("dragleave", handleDragLeave);
      div.addEventListener("drop", handleDrop);
      div.addEventListener("dragend", handleDragEnd);
    }

    playerList.appendChild(div);
  });
}

let draggedKey = null;

function handleDragStart(e) {
  draggedKey = this.dataset.key;
  this.classList.add("dragging");
}

function handleDragOver(e) {
  e.preventDefault();
  this.classList.add("drag-over");
}

function handleDragLeave() {
  this.classList.remove("drag-over");
}

function handleDrop() {
  this.classList.remove("drag-over");
  const targetKey = this.dataset.key;

  if (!draggedKey || draggedKey === targetKey) return;

  const ordered = Object.entries(latestSnapshot).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt
  );

  const draggedIndex = ordered.findIndex(([k]) => k === draggedKey);
  const targetIndex = ordered.findIndex(([k]) => k === targetKey);

  if (draggedIndex === -1 || targetIndex === -1) return;

  const updated = [...ordered];
  const [moved] = updated.splice(draggedIndex, 1);
  updated.splice(targetIndex, 0, moved);

  const now = Date.now();
  const updates = {};
  updated.forEach(([key, val], i) => {
    updates[key] = { ...val, joinedAt: now + i };
  });

  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  set(playersRef, updates);
  draggedKey = null;
}

function handleDragEnd() {
  this.classList.remove("dragging");
}

window.setPlayerStatus = function (key, status) {
  const playerRef = ref(db, `rooms/${currentRoom}/players/${key}`);
  const updates =
    status === "active"
      ? { active: true, skip: false, joinedAt: Date.now() }
      : status === "skip"
      ? { active: true, skip: true, joinedAt: Date.now() }
      : { active: false, skip: false };
  update(playerRef, updates);
};

window.removePlayer = function (key) {
  const playerRef = ref(db, `rooms/${currentRoom}/players/${key}`);
  remove(playerRef);
};

window.toggleReorderMode = function () {
  reorderMode = !reorderMode;
  reorderToggle.textContent = reorderMode ? "Finish Reordering" : "Enable Reorder Mode";
  renderPlayers();
};
