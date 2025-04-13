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
const currentNextUp = document.getElementById("currentNextUp");
const reorderToggle = document.getElementById("reorderToggle");

function switchRoom(room) {
  currentRoom = room;
  roomTitle.textContent = `Room: ${currentRoom}`;
  listenToRoom();
}

function listenToRoom() {
  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(playersRef, (snapshot) => {
    latestSnapshot = snapshot.val() || {};
    displayPlayers(latestSnapshot);
  });
}

function displayPlayers(data) {
  const entries = Object.entries(data).sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  const active = entries.filter(([_, p]) => p.active && !p.skip);
  const skip = entries.filter(([_, p]) => p.active && p.skip);
  const out = entries.filter(([_, p]) => !p.active);

  const currentUp = active[0]?.[0];
  currentNextUp.textContent = currentUp ? `Next Up: ${currentUp}` : "";

  document.getElementById("activePlayers").innerHTML = "";
  document.getElementById("skipPlayers").innerHTML = "";
  document.getElementById("outPlayers").innerHTML = "";

  renderGroup(active, "activePlayers", "bg-green-500", "Active");
  renderGroup(skip, "skipPlayers", "bg-yellow-500", "With Customer");
  renderGroup(out, "outPlayers", "bg-red-500", "Out");
}

function renderGroup(entries, containerId, badge, label) {
  const container = document.getElementById(containerId);

  entries.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = "bg-white rounded shadow px-4 py-3";
    div.dataset.key = key;

    div.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full" style="background-color: ${player.color}"></span>
          <span class="font-semibold text-base">${player.name}</span>
        </div>
        <span class="text-sm text-white px-2 py-1 rounded ${badge}">${label}</span>
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

    div.querySelector("div").addEventListener("click", () => {
      div.classList.toggle("expanded");
    });

    container.appendChild(div);
  });
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

window.toggleReorderMode = function () {
  reorderMode = !reorderMode;
  reorderToggle.textContent = reorderMode ? "Finish Reordering" : "Enable Reorder Mode";
  displayPlayers
