import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set,
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

let currentRoom = "";
let reorderMode = false;
let latestSnapshot = {};

const roomTitle = document.getElementById("roomTitle");
const currentNextUp = document.getElementById("currentNextUp");
const playerList = document.getElementById("playerList");
const withCustomerList = document.getElementById("withCustomerList");
const outOfRotationList = document.getElementById("outOfRotationList");
const reorderToggle = document.getElementById("reorderToggle");

window.checkPassword = function () {
  const input = document.getElementById("adminPassword").value.trim().toLowerCase();

  if (input === "afia") {
    currentRoom = "BH"; // You could enhance this to choose a room
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    roomTitle.textContent = `Room: ${currentRoom}`;
    listenToRoom();
  } else {
    alert("Incorrect password.");
  }
};

function listenToRoom() {
  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(playersRef, (snapshot) => {
    latestSnapshot = snapshot.val() || {};
    displayPlayers(latestSnapshot);
  });
}

window.toggleReorderMode = function () {
  reorderMode = !reorderMode;
  reorderToggle.textContent = reorderMode ? "Finish Reordering" : "Enable Reorder Mode";
  displayPlayers(latestSnapshot);
};

function displayPlayers(data) {
  const entries = Object.entries(data).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const active = entries.filter(([_, p]) => p.active && !p.skip);
  const withCustomer = entries.filter(([_, p]) => p.active && p.skip);
  const out = entries.filter(([_, p]) => !p.active);

  currentNextUp.textContent = active[0]
    ? `Next Up: ${active[0][1].name}`
    : "No one is up next";

  renderSection(playerList, active, "Active");
  renderSection(withCustomerList, withCustomer, "With Customer");
  renderSection(outOfRotationList, out, "Out");
}

function renderSection(container, players, type) {
  container.innerHTML = "";
  players.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = "bg-white rounded shadow px-4 py-3 draggable transition-all";
    div.dataset.key = key;
    div.dataset.status = type;

    let badge = "bg-green-600";
    if (type === "With Customer") badge = "bg-yellow-500";
    if (type === "Out") badge = "bg-red-500";

    div.innerHTML = `
      <div class="flex items-center justify-between cursor-pointer player-header">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full" style="background-color: ${player.color}"></span>
          <span class="font-semibold">${player.name}</span>
        </div>
        <span class="text-sm text-white px-2 py-1 rounded ${badge}">${type}</span>
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

    div.querySelector(".player-header").addEventListener("click", () => {
      div.classList.toggle("expanded");
    });

    if (reorderMode && type === "Active") {
      div.setAttribute("draggable", true);
      div.addEventListener("dragstart", handleDragStart);
      div.addEventListener("dragover", handleDragOver);
      div.addEventListener("drop", handleDrop);
      div.addEventListener("dragend", handleDragEnd);
    }

    container.appendChild(div);
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

function handleDrop(e) {
  e.preventDefault();
  const targetKey = this.dataset.key;
  reorderPlayers(draggedKey, targetKey);
  this.classList.remove("drag-over");
}

function handleDragEnd() {
  document.querySelectorAll(".dragging").forEach(el => el.classList.remove("dragging"));
}

function reorderPlayers(fromKey, toKey) {
  const ordered = Object.entries(latestSnapshot)
    .filter(([_, p]) => p.active && !p.skip)
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  const fromIndex = ordered.findIndex(([k]) => k === fromKey);
  const toIndex = ordered.findIndex(([k]) => k === toKey);
  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved);

  const now = Date.now();
  const updates = {};
  ordered.forEach(([key, val], i) => {
    updates[key] = { ...val, joinedAt: now + i };
  });

  set(ref(db, `rooms/${currentRoom}/players`), { ...latestSnapshot, ...updates });
}

window.setStatus = function (key, status) {
  const refPath = ref(db, `rooms/${currentRoom}/players/${key}`);
  if (status === "active") {
    update(refPath, { active: true, skip: false, joinedAt: Date.now() });
  } else if (status === "skip") {
    update(refPath, { active: true, skip: true, joinedAt: Date.now() });
  } else {
    update(refPath, { active: false, skip: false });
  }
};

window.removePlayer = function (key) {
  const refPath = ref(db, `rooms/${currentRoom}/players/${key}`);
  remove(refPath);
};

window.resetAllPlayers = function () {
  if (!confirm("Are you sure you want to remove all players?")) return;
  set(ref(db, `rooms/BH/players`), {});
  set(ref(db, `rooms/59/players`), {});
};