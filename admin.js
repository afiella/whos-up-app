import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue, update, remove, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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
const currentNextUp = document.getElementById("currentNextUp");
const playerList = document.getElementById("playerList");
const reorderToggle = document.getElementById("reorderToggle");

window.switchRoom = function (room) {
  currentRoom = room;
  roomTitle.textContent = `Room: ${currentRoom}`;
  listenToRoom();
};

window.toggleReorderMode = function () {
  reorderMode = !reorderMode;
  reorderToggle.textContent = reorderMode ? "Finish Reordering" : "Enable Reorder Mode";
  displayPlayers(latestSnapshot);
};

window.resetAllPlayers = function () {
  set(ref(db, `rooms/BH/players`), {});
  set(ref(db, `rooms/59/players`), {});
};

function listenToRoom() {
  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(playersRef, (snapshot) => {
    latestSnapshot = snapshot.val() || {};
    displayPlayers(latestSnapshot);
  });
}

function displayPlayers(data) {
  const entries = Object.entries(data).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const activePlayers = entries.filter(([_, p]) => p.active && !p.skip);
  const skipPlayers = entries.filter(([_, p]) => p.active && p.skip);
  const outPlayers = entries.filter(([_, p]) => !p.active);

  const currentUp = activePlayers[0]?.[0];
  currentNextUp.textContent = currentUp ? `Next Up: ${currentUp}` : "";

  playerList.innerHTML = "";

  renderGroup("Active Players", activePlayers, "bg-green-600", "Active");
  renderGroup("With Customer", skipPlayers, "bg-yellow-500", "With Customer");
  renderGroup("Out of Rotation", outPlayers, "bg-red-500", "Out of Rotation");
}

function renderGroup(header, group, badgeColor, statusLabel) {
  const section = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "font-bold text-md mb-2";
  title.textContent = header;
  section.appendChild(title);

  group.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = "bg-white rounded shadow px-4 py-3 draggable";
    div.setAttribute("draggable", reorderMode);
    div.dataset.key = key;

    div.innerHTML = `
      <div class="flex items-center justify-between cursor-pointer player-header">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full" style="background-color: ${player.color}"></span>
          <span class="font-semibold text-lg">${player.name}</span>
        </div>
        <span class="text-sm text-white px-2 py-1 rounded ${badgeColor}">${statusLabel}</span>
      </div>
      <div class="action-buttons mt-3 space-y-2">
        <div class="flex justify-between">
          <button onclick="setStatus('${key}', 'active')" class="bg-green-600 text-white px-2 py-1 rounded text-sm w-full mr-1">In</button>
          <button onclick="setStatus('${key}', 'skip')" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm w-full mx-1">With Customer</button>
          <button onclick="setStatus('${key}', 'inactive')" class="bg-red-500 text-white px-2 py-1 rounded text-sm w-full ml-1">Out</button>
        </div>
        <div class="text-center">
          <button onclick="removePlayer('${key}')" class="text-red-600 text-sm font-bold">✕ Remove</button>
        </div>
      </div>
    `;

    div.querySelector(".player-header").addEventListener("click", () => {
      div.classList.toggle("expanded");
    });

    section.appendChild(div);
  });

  playerList.appendChild(section);
}

window.setStatus = function (key, status) {
  const updates = status === "active"
    ? { active: true, skip: false, joinedAt: Date.now() }
    : status === "skip"
    ? { active: true, skip: true, joinedAt: Date.now() }
    : { active: false, skip: false };
  update(ref(db, `rooms/${currentRoom}/players/${key}`), updates);
};

window.removePlayer = function (key) {
  remove(ref(db, `rooms/${currentRoom}/players/${key}`));
};
