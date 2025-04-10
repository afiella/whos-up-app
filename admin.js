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

let currentRoom = null;
const roomTitle = document.getElementById("roomTitle");
const playerList = document.getElementById("playerList");
const reorderBtn = document.getElementById("reorderBtn");
let reorderMode = false;
let latestSnapshot = {};

window.checkPassword = function () {
  const input = document.getElementById("adminPassword").value.trim();
  if (input === "afia") {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
  } else {
    alert("Incorrect password");
  }
};

window.loadRoom = function (room) {
  currentRoom = room;
  roomTitle.textContent = `Room: ${room}`;
  reorderBtn.classList.remove("hidden");

  const playersRef = ref(db, `rooms/${room}/players`);
  onValue(playersRef, (snapshot) => {
    latestSnapshot = snapshot.val() || {};
    displayPlayers(latestSnapshot);
  });
};

function displayPlayers(data) {
  const players = Object.entries(data).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt
  );
  const activePlayers = players.filter(([_, p]) => p.active && !p.skip);
  const currentNext = activePlayers[0]?.[0];

  playerList.innerHTML = "";
  players.forEach(([key, player], index) => {
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
    div.className = "flex justify-between items-center bg-white p-3 rounded shadow";

    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full" style="background:${player.color}"></div>
        <span class="font-semibold">${player.name}</span>
        <span class="text-xs px-2 py-1 rounded text-white ${badgeColor}">${status}</span>
        ${
          key === currentNext
            ? '<span class="ml-2 text-sm text-blue-600 font-bold">(Up Now)</span>'
            : ""
        }
      </div>
      <div class="flex gap-2">
        ${
          reorderMode
            ? `
          <button onclick="movePlayer('${key}', -1)" class="text-lg px-2">⬆️</button>
          <button onclick="movePlayer('${key}', 1)" class="text-lg px-2">⬇️</button>`
            : ""
        }
        <button onclick="setStatus('${key}', 'active')" class="bg-green-500 text-white px-2 py-1 rounded text-sm">Back In</button>
        <button onclick="setStatus('${key}', 'skip')" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm">With Customer</button>
        <button onclick="setStatus('${key}', 'inactive')" class="bg-gray-500 text-white px-2 py-1 rounded text-sm">Out</button>
        <button onclick="removePlayer('${key}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Remove</button>
      </div>
    `;
    playerList.appendChild(div);
  });
}

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

window.reorderQueue = function () {
  reorderMode = !reorderMode;
  reorderBtn.textContent = reorderMode ? "Finish Reordering" : "Reorder Queue";
  displayPlayers(latestSnapshot);
};

window.movePlayer = function (name, direction) {
  const entries = Object.entries(latestSnapshot).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt
  );
  const index = entries.findIndex(([key]) => key === name);
  const swapIndex = index + direction;

  if (index === -1 || swapIndex < 0 || swapIndex >= entries.length) return;

  const now = Date.now();
  entries[index][1].joinedAt = now + direction;
  entries[swapIndex][1].joinedAt = now;

  const updates = {};
  entries.forEach(([key, val]) => {
    updates[key] = val;
  });

  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  set(playersRef, updates);
};
