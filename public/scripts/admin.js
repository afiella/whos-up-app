import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set,
  get
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Firebase config
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

// Name + Color Data
const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc", "#b9a3e3"];

// State
let currentRoom = "BH";
let reorderMode = false;
let latestSnapshot = {};
let draggedKey = null;

// DOM Elements
const roomTitleEl = document.getElementById("roomTitle");
const currentNextUpEl = document.getElementById("currentNextUp");
const playerListEl = document.getElementById("playerList");
const ghostDropdown = document.getElementById("ghostNameSelect");
const reorderToggle = document.getElementById("reorderToggle");

// Switch room
window.switchRoom = function (room) {
  currentRoom = room;
  roomTitleEl.textContent = `Room: ${room}`;
  listenToRoom();
};

// Listen to Firebase data
function listenToRoom() {
  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(playersRef, (snapshot) => {
    const data = snapshot.val() || {};
    latestSnapshot = data;
    displayPlayers(data);
    updateGhostDropdown(data);
  });
}

// Display Players
function displayPlayers(data) {
  playerListEl.innerHTML = "";
  const entries = Object.entries(data).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const active = entries.filter(([_, p]) => p.active && !p.skip);
  const skip = entries.filter(([_, p]) => p.active && p.skip);
  const out = entries.filter(([_, p]) => !p.active);
  const combined = [...active, ...skip, ...out];

  currentNextUpEl.textContent = active[0] ? `Next Up: ${active[0][1].name}` : "Next Up: —";

  combined.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = `bg-white rounded shadow px-4 py-3 transition-all ${player.ghost ? "opacity-50 italic" : ""}`;
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

    if (reorderMode) {
      div.setAttribute("draggable", true);
      div.classList.add("cursor-move");

      div.addEventListener("dragstart", handleDragStart);
      div.addEventListener("dragover", handleDragOver);
      div.addEventListener("drop", handleDrop);
      div.addEventListener("dragend", handleDragEnd);
    }

    playerListEl.appendChild(div);
  });
}

// Set Player Status
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

// Remove Player
window.removePlayer = function (key) {
  remove(ref(db, `rooms/${currentRoom}/players/${key}`));
};

// Reset All
window.resetAllPlayers = function () {
  set(ref(db, "rooms/BH/players"), {});
  set(ref(db, "rooms/59/players"), {});
};

// Update Ghost Dropdown
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

// Add Ghost Player
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

// Reorder Mode Toggle
window.toggleReorderMode = function () {
  reorderMode = !reorderMode;
  document.getElementById("reorderToggle").textContent = reorderMode ? "Finish Reordering" : "Enable Reorder Mode";
  displayPlayers(latestSnapshot);
};

// Drag + Drop Events
function handleDragStart(e) {
  draggedKey = this.dataset.key;
  this.classList.add("opacity-50");
}

function handleDragOver(e) {
  e.preventDefault();
  this.classList.add("ring-2", "ring-blue-400");
}

function handleDrop(e) {
  e.preventDefault();
  const targetKey = this.dataset.key;

  const ordered = Object.entries(latestSnapshot)
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  const fromIndex = ordered.findIndex(([k]) => k === draggedKey);
  const toIndex = ordered.findIndex(([k]) => k === targetKey);

  if (fromIndex === -1 || toIndex === -1) return;

  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved);

  const now = Date.now();
  const updates = {};
  ordered.forEach(([key, val], i) => {
    updates[key] = { ...val, joinedAt: now + i };
  });

  set(ref(db, `rooms/${currentRoom}/players`), { ...latestSnapshot, ...updates });
}

function handleDragEnd() {
  draggedKey = null;
  document.querySelectorAll(".ring-2").forEach(el => el.classList.remove("ring-2", "ring-blue-400"));
  document.querySelectorAll(".opacity-50").forEach(el => el.classList.remove("opacity-50"));
}

reorderBtn.innerText = 'Enable Reorder Mode';

// Click handler toggles drag-and-drop
reorderBtn.addEventListener('click', () => {
  if (!sortableInstance) {
    // Activate reorder mode
    reorderBtn.innerText = 'Reorder Players';
    reorderBtn.classList.add('active-reorder');

    // Initialize SortableJS on the player list
    sortableInstance = Sortable.create(playerList, {
      animation: 200,
      handle: '.drag-handle',       // optional: only allow dragging from a specific handle
      ghostClass: 'sortable-ghost', // class when dragging
      dragClass: 'sortable-drag',   // class on the moving element
      onEnd: (evt) => {
        // evt.oldIndex, evt.newIndex available
        const newOrder = [...playerList.children].map(el => el.dataset.playerId);
        console.log('New player order:', newOrder);
        // TODO: sync with Firebase or backend here
      }
    });
  } else {
    // Deactivate reorder mode
    sortableInstance.destroy();
    sortableInstance = null;
    reorderBtn.innerText = 'Enable Reorder Mode';
    reorderBtn.classList.remove('active-reorder');
  }
});

// Initialize
switchRoom(currentRoom);

window.joinAsPlayer = async function () {
  const inputEl = document.getElementById("adminJoinName");
  if (!inputEl) return;

  const rawInput = inputEl.value.trim();
  const name = nameList.find(n => n.toLowerCase() === rawInput.toLowerCase());
  if (!name) {
    alert("Please enter a valid name from the list.");
    return;
  }

  const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  const snapshot = await get(playerRef);
  const existing = snapshot.exists() ? snapshot.val() : null;

  const index = nameList.indexOf(name);
  const color = colorList[index % colorList.length];

  const playerData = {
    name,
    color,
    ghost: false,
    active: true,
    skip: false,
    joinedAt: Date.now()
  };

  if (existing?.ghost) {
    await update(playerRef, playerData);
  } else if (!existing) {
    await set(playerRef, playerData);
  } else {
    alert("That name is already taken.");
    return;
  }

  alert(`You have joined the ${currentRoom} room as ${name}`);
};