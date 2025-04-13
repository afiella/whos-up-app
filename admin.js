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

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Global state
let currentRoom = "BH";
let reorderMode = false;
let latestSnapshot = {};

// DOM references
const loginForm     = document.getElementById("loginForm");
const adminUI       = document.getElementById("adminUI");
const usernameEl    = document.getElementById("username");
const passwordEl    = document.getElementById("password");
const roomTitle     = document.getElementById("roomTitle");
const currentNextUp = document.getElementById("currentNextUp");
const playerList    = document.getElementById("playerList");
const reorderToggle = document.getElementById("reorderToggle");

// --- LOGIN LOGIC ---
window.login = function() {
  const username = usernameEl.value.trim();
  const password = passwordEl.value.trim();

  // Simple validation check
  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  // TODO: Replace with real authentication as needed
  console.log("Logging in with:", username);

  // Hide login form, show admin UI
  loginForm.style.display = "none";
  adminUI.style.display   = "block";

  // Start listening to the default room
  switchRoom(currentRoom);
};

// Pressing ENTER inside username/password triggers login
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const activeElement = document.activeElement;
    if (activeElement === usernameEl || activeElement === passwordEl) {
      e.preventDefault();
      window.login();
    }
  }
});

// --- ROOM / PLAYER LOGIC ---
window.switchRoom = function(room) {
  currentRoom = room;
  roomTitle.textContent = "Room: " + room;
  listenToRoom();
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
  const currentUp = activePlayers[0]?.[0];
  currentNextUp.textContent = currentUp ? `Next Up: ${currentUp}` : "";

  playerList.innerHTML = "";

  entries.forEach(([key, player]) => {
    let status = "Active";
    let badge = "bg-green-500";
    if (player.skip) {
      status = "With Customer";
      badge = "bg-yellow-500";
    } else if (!player.active) {
      status = "Out";
      badge = "bg-red-500";
    }

    const div = document.createElement("div");
    div.className = "bg-white rounded shadow px-4 py-3 draggable transition-all";
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

    // Expand/collapse action buttons
    div.querySelector(".player-header").addEventListener("click", () => {
      div.classList.toggle("expanded");
    });

    // If reorder mode is on, set up drag & drop events
    if (reorderMode) {
      div.classList.add("border", "border-blue-400");
      div.addEventListener("dragstart", handleDragStart);
      div.addEventListener("dragover", handleDragOver);
      div.addEventListener("dragleave", handleDragLeave);
      div.addEventListener("drop", handleDrop);
      div.addEventListener("dragend", handleDragEnd);
    }

    playerList.appendChild(div);
  });
}

// --- REORDER DRAG & DROP ---
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
  reorderPlayers(draggedKey, targetKey);
}

function handleDragEnd() {
  this.classList.remove("dragging");
}

function reorderPlayers(fromKey, toKey) {
  if (!fromKey || !toKey || fromKey === toKey) return;

  const ordered = Object.entries(latestSnapshot).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const fromIndex = ordered.findIndex(([k]) => k === fromKey);
  const toIndex = ordered.findIndex(([k]) => k === toKey);

  if (fromIndex === -1 || toIndex === -1) return;

  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved);

  // Reassign joinedAt times in ascending order
  const now = Date.now();
  const updates = {};
  ordered.forEach(([k, val], i) => {
    updates[k] = { ...val, joinedAt: now + i };
  });

  set(ref(db, `rooms/${currentRoom}/players`), updates);
}

// --- PLAYER STATUS AND REMOVAL ---
window.setStatus = function(key, status) {
  const updates =
    status === "active"
      ? { active: true, skip: false, joinedAt: Date.now() }
      : status === "skip"
      ? { active: true, skip: true, joinedAt: Date.now() }
      : { active: false, skip: false };

  update(ref(db, `rooms/${currentRoom}/players/${key}`), updates);
};

window.removePlayer = function(key) {
  remove(ref(db, `rooms/${currentRoom}/players/${key}`));
};

// --- TOGGLE REORDER MODE ---
window.toggleReorderMode = function() {
  reorderMode = !reorderMode;
  reorderToggle.textContent = reorderMode ? "Finish Reordering" : "Enable Reorder Mode";
  displayPlayers(latestSnapshot);
};

// --- RESET ALL PLAYERS IN BOTH ROOMS ---
window.resetAllPlayers = function() {
  set(ref(db, "rooms/BH/players"), {});
  set(ref(db, "rooms/59/players"), {});
};
