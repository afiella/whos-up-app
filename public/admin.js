// admin.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// --- Replace these with your actual Firebase configuration ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "who-s-up-app.firebaseapp.com",
  databaseURL: "https://who-s-up-app-default-rtdb.firebaseio.com",
  projectId: "who-s-up-app",
  storageBucket: "who-s-up-app.appspot.com",
  messagingSenderId: "167292375113",
  appId: "1:167292375113:web:ce718a1aab4852fe5daf98"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Global State
let currentRoom = "BH";  // default room; user can click to change to "59"
let latestSnapshot = {};

// DOM References
const roomTitleEl = document.getElementById("roomTitle");
const currentNextUpEl = document.getElementById("currentNextUp");
const playerListEl = document.getElementById("playerList");

// --- ROOM SWITCH FUNCTION ---
window.switchRoom = function(room) {
  currentRoom = room;
  roomTitleEl.textContent = `Room: ${room}`;
  listenToRoom();
};

// --- REAL-TIME DATA LISTENER ---
function listenToRoom() {
  // Set up a real-time listener on the current room’s players
  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(playersRef, (snapshot) => {
    latestSnapshot = snapshot.val() || {};
    displayPlayers(latestSnapshot);
  });
}

// --- DISPLAY PLAYERS FUNCTION ---
function displayPlayers(data) {
  // Clear the current player list
  playerListEl.innerHTML = "";

  // Convert the data object to an array and sort by join time
  const entries = Object.entries(data).sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  // Determine the next active (non-skipped) player
  const activePlayers = entries.filter(([_, p]) => p.active && !p.skip);
  const nextUp = activePlayers[0] ? activePlayers[0][1].name : "None";
  currentNextUpEl.textContent = `Next Up: ${nextUp}`;

  // Render each player as an entry
  entries.forEach(([key, player]) => {
    let status = "";
    let badgeClass = "";
    if (player.active && !player.skip) {
      status = "Active";
      badgeClass = "bg-green-500";
    } else if (player.active && player.skip) {
      status = "With Customer";
      badgeClass = "bg-yellow-500";
    } else {
      status = "Out";
      badgeClass = "bg-red-500";
    }

    const div = document.createElement("div");
    div.className = "bg-white rounded shadow px-4 py-3 transition-all";
    div.dataset.key = key;
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
          <button onclick="setStatus('${key}','active')" class="bg-green-500 text-white px-2 py-1 rounded text-sm w-full mr-1">In</button>
          <button onclick="setStatus('${key}','skip')" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm w-full mx-1">Customer</button>
          <button onclick="setStatus('${key}','inactive')" class="bg-gray-500 text-white px-2 py-1 rounded text-sm w-full ml-1">Out</button>
        </div>
        <div class="text-center">
          <button onclick="removePlayer('${key}')" class="text-red-600 text-sm font-bold">✕ Remove</button>
        </div>
      </div>
    `;

    // Toggle expand/collapse on header click
    div.querySelector(".player-header").addEventListener("click", () => {
      div.classList.toggle("expanded");
    });

    playerListEl.appendChild(div);
  });
}

// --- UPDATE PLAYER STATUS ---
window.setStatus = function(key, statusType) {
  // Create an updates object based on the desired status
  const updates = statusType === "active" ? 
                    { active: true, skip: false, joinedAt: Date.now() } : 
                  statusType === "skip" ? 
                    { active: true, skip: true, joinedAt: Date.now() } : 
                    { active: false, skip: false };

  update(ref(db, `rooms/${currentRoom}/players/${key}`), updates);
};

// --- REMOVE A PLAYER ---
window.removePlayer = function(key) {
  remove(ref(db, `rooms/${currentRoom}/players/${key}`));
};

// --- RESET BOTH ROOMS ---
window.resetAllPlayers = function() {
  set(ref(db, "rooms/BH/players"), {});
  set(ref(db, "rooms/59/players"), {});
};

// --- INITIALIZE ---
switchRoom(currentRoom);
