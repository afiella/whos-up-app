import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Firebase config
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

// Hardcoded for 59 room
const currentRoom = "59";

const roomTitle = document.getElementById("roomTitle");
const playerList = document.getElementById("playerList");
const reorderToggle = document.getElementById("reorderToggle");
const currentNextUp = document.getElementById("currentNextUp");

let latestSnapshot = {};
let reorderMode = false;

// Password Check
window.checkPassword = function () {
  const input = document.getElementById("adminPassword").value.trim();
  if (input === "59mod") {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    loadRoom(); // Automatically loads the 59 room
  } else {
    alert("Incorrect password");
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
  const entries = Object.entries(data).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt
  );
  const activePlayers = entries.filter(([_, p]) => p.active && !p.skip);
  const upNext = activePlayers[0]?.[0];
  currentNextUp.textContent = upNext ? `Currently up: ${upNext}` : "No one is up";

  playerList.innerHTML = "";

  entries.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = "bg-white p-3 rounded shadow flex justify-between items-center";
    div.draggable = reorderMode;
    div.dataset.name = key;

    let status = "Active";
    let badgeColor = "bg-green-500";
    if (!player.active) {
      status = "Out of Rotation";
      badgeColor = "bg-red-500";
    } else if (player.skip) {
      status = "With Customer";
      badgeColor = "bg-yellow-500";
    }

    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-6 h-6 rounded-full" style="background:${player.color}"></div>
        <span class="font-semibold">${player.name}</span>
        <span class="text-xs text-white px-2 py-1 rounded ${badgeColor}">${status}</span>
        ${key === upNext ? `<span class="text-blue-500 font-semibold text-sm">(Up Now)</span>` : ""}
      </div>
      <div class="flex gap-2 action-buttons ${reorderMode ? '' : 'hidden'}">
        <button onclick="movePlayer('${key}', -1)" class="text-lg px-2">⬆️</button>
        <button onclick="movePlayer('${key}', 1)" class="text-lg px-2">⬇️</button>
      </div>
      <div class="flex gap-2 ml-2">
        <button onclick="setStatus('${key}', 'active')" class="bg-green-500 text-white text-xs px-2 py-1 rounded">In</button>
        <button onclick="setStatus('${key}', 'skip')" class="bg-yellow-500 text-white text-xs px-2 py-1 rounded">With Customer</button>
        <button onclick="setStatus('${key}', 'inactive')" class="bg-gray-500 text-white text-xs px-2 py-1 rounded">Out</button>
        <button onclick="removePlayer('${key}')" class="text-red-600 font-bold">✕</button>
      </div>
    `;

    playerList.appendChild(div);
  });
}

// Status updates
window.setStatus = function (name, status) {
  const player = latestSnapshot[name];
  if (!player) return;
  let updates = {};
  if (status === "active") {
    updates = { active: true, skip: false, joinedAt: Date.now() };
  } else if (status === "skip") {
    updates = { active: true, skip: true, joinedAt: Date.now() };
  } else {
    updates = { active: false, skip: false };
  }
  const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  update(playerRef, updates);
};

window.removePlayer = function (name) {
  const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  remove(playerRef);
};

// Reorder Mode Toggle
window.toggleReorderMode = function () {
  reorderMode = !reorderMode;
  reorderToggle.textContent = reorderMode ? "Finish Reordering" : "Enable Reorder Mode";
  displayPlayers(latestSnapshot);
};

// Move player in list
window.movePlayer = function (name, direction) {
  const entries = Object.entries(latestSnapshot).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt
  );
  const index = entries.findIndex(([key]) => key === name);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= entries.length) return;

  const now = Date.now();
  entries[index][1].joinedAt = now + direction;
  entries[targetIndex][1].joinedAt = now;

  const updates = {};
  entries.forEach(([key, val]) => (updates[key] = val));

  const refPath = ref(db, `rooms/${currentRoom}/players`);
  set(refPath, updates);
};
