import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// --- Firebase Config ---
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

// --- Name and Color List ---
const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc", "#b9a3e3"];

// --- DOM Elements ---
let currentRoom = "BH";
const roomTitleEl = document.getElementById("roomTitle");
const currentNextUpEl = document.getElementById("currentNextUp");
const playerListEl = document.getElementById("playerList");
const ghostDropdown = document.getElementById("ghostNameSelect");

// --- ROOM SWITCH ---
window.switchRoom = function (room) {
  currentRoom = room;
  roomTitleEl.textContent = `Room: ${room}`;
  listenToRoom();
};

// --- LISTEN FOR CHANGES ---
function listenToRoom() {
  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(playersRef, (snapshot) => {
    const data = snapshot.val() || {};
    displayPlayers(data);
    updateGhostDropdown(data);
  });
}

// --- DISPLAY PLAYERS IN ORDER ---
function displayPlayers(data) {
  playerListEl.innerHTML = "";

  const entries = Object.entries(data).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const active = entries.filter(([_, p]) => p.active && !p.skip);
  const skip = entries.filter(([_, p]) => p.active && p.skip);
  const out = entries.filter(([_, p]) => !p.active);

  currentNextUpEl.textContent = active[0] ? `Next Up: ${active[0][1].name}` : "Next Up: —";

  const combined = [...active, ...skip, ...out];

  combined.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = `bg-white rounded shadow px-4 py-3 transition-all ${player.ghost ? "ghost-tag" : ""}`;
    div.dataset.key = key;

    let status = "Out", badgeClass = "bg-red-500";
    if (player.active && !player.skip) {
      status = "Active"; badgeClass = "bg-green-500";
    } else if (player.active && player.skip) {
      status = "With Customer"; badgeClass = "bg-yellow-500";
    }

    div.innerHTML = `
      <div class="flex items-center justify-between cursor-pointer player-header">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full" style="background-color:${player.color}"></span>
          <span class="font-semibold">${player.name}</span>
        </div>
        <span class="text-sm text-white px-2 py-1 rounded ${badgeClass}">${status}</span>
      </div>
      <div class="action-buttons mt-3 space-y-2">
        <div class="flex justify-between">
          <button onclick="setStatus('${key}', 'active')" class="bg-green-500 text-white px-2 py-1 rounded text-sm w-full mr-1">In</button>
          <button onclick="setStatus('${key}', 'skip')" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm w-full mx-1">Customer</button>
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

    playerListEl.appendChild(div);
  });
}

// --- UPDATE STATUS ---
window.setStatus = function (key, status) {
  const refPath = ref(db, `rooms/${currentRoom}/players/${key}`);
  const updates =
    status === "active"
      ? { active: true, skip: false, joinedAt: Date.now() }
      : status === "skip"
      ? { active: true, skip: true, joinedAt: Date.now() }
      : { active: false, skip: false };

  update(refPath, updates);
};

// --- REMOVE PLAYER ---
window.removePlayer = function (key) {
  remove(ref(db, `rooms/${currentRoom}/players/${key}`));
};

// --- RESET ALL PLAYERS ---
window.resetAllPlayers = function () {
  set(ref(db, "rooms/BH/players"), {});
  set(ref(db, "rooms/59/players"), {});
};

// --- GHOST PLAYER LOGIC ---
function updateGhostDropdown(players) {
  if (!ghostDropdown) return;
  ghostDropdown.innerHTML = "";

  nameList.forEach((name, i) => {
    const player = players[name];
    const isTaken = player && !player.ghost;

    if (!isTaken) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      ghostDropdown.appendChild(option);
    }
  });
}

window.addGhostPlayer = function () {
  const name = ghostDropdown.value;
  if (!name) return;

  const index = nameList.indexOf(name);
  const color = colorList[index % colorList.length];

  const ghostData = {
    name,
    color,
    ghost: true,
    active: true,
    skip: false,
    joinedAt: Date.now()
  };

  const ghostRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  set(ghostRef, ghostData);
};

// --- Start listening to the default room on load
switchRoom(currentRoom);