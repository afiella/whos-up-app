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

let currentRoom = "";
let reorderMode = false;
let latestSnapshot = {};

const roomTitle = document.getElementById("roomTitle");
const currentNextUp = document.getElementById("currentNextUp");
const playerList = document.getElementById("playerList");
const reorderToggle = document.getElementById("reorderToggle");

window.checkPassword = function () {
  const input = document.getElementById("adminPassword").value.trim();
  if (input === "afia") {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
  } else {
    alert("Incorrect password.");
  }
};

window.loadRoom = function (room) {
  currentRoom = room;
  roomTitle.textContent = `Room: ${room}`;
  const playersRef = ref(db, `rooms/${room}/players`);
  onValue(playersRef, (snapshot) => {
    latestSnapshot = snapshot.val() || {};
    displayPlayers(latestSnapshot);
  });
};

function displayPlayers(data) {
  const players = Object.entries(data).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const activePlayers = players.filter(([_, p]) => p.active && !p.skip);
  const currentUp = activePlayers[0]?.[0];
  currentNextUp.textContent = currentUp ? `Current: ${currentUp}` : "No one is up";

  playerList.innerHTML = "";

  players.forEach(([key, player]) => {
    let status = "Active";
    let badge = "bg-green-500";
    if (player.skip) {
      status = "With Customer";
      badge = "bg-yellow-500";
    } else if (!player.active) {
      status = "Out";
      badge = "bg-red-500";
    }

    const container = document.createElement("div");
    container.className = "bg-white rounded shadow px-4 py-3";
    container.setAttribute("draggable", reorderMode);
    container.dataset.name = key;

    container.innerHTML = `
      <div class="flex items-center justify-between cursor-pointer player-header">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full" style="background-color: ${player.color}"></span>
          <span class="font-semibold">${player.name}</span>
        </div>
        <span class="text-sm text-gray-500">${status}</span>
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

    container.querySelector(".player-header").addEventListener("click", () => {
      container.classList.toggle("expanded");
    });

    if (reorderMode) {
      container.classList.add("border", "border-blue-400");
      container.addEventListener("dragstart", (e) => {
        container.classList.add("dragging");
        e.dataTransfer.setData("text/plain", key);
      });

      container.addEventListener("dragover", (e) => {
        e.preventDefault();
        container.classList.add("drag-over");
      });

      container.addEventListener("dragleave", () => {
        container.classList.remove("drag-over");
      });

      container.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedKey = e.dataTransfer.getData("text/plain");
        reorderPlayer(draggedKey, key);
        container.classList.remove("drag-over");
      });

      container.addEventListener("dragend", () => {
        container.classList.remove("dragging");
      });
    }

    playerList.appendChild(container);
  });
}

window.setStatus = function (name, status) {
  const player = latestSnapshot[name];
  if (!player) return;
  const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  let updates = {};

  if (status === "active") {
    updates = { active: true, skip: false, joinedAt: Date.now() };
  } else if (status === "skip") {
    updates = { active: true, skip: true, joinedAt: Date.now() };
  } else {
    updates = { active: false, skip: false };
  }

  update(playerRef, updates);
};

window.removePlayer = function (name) {
  const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  remove(playerRef);
};

window.toggleReorderMode = function () {
  reorderMode = !reorderMode;
  reorderToggle.textContent = reorderMode ? "Finish Reorder" : "Enable Reorder Mode";
  displayPlayers(latestSnapshot);
};

function reorderPlayer(draggedName, targetName) {
  const ordered = Object.entries(latestSnapshot).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const dragged = ordered.find(([key]) => key === draggedName);
  const target = ordered.find(([key]) => key === targetName);

  if (!dragged || !target) return;

  ordered.splice(ordered.indexOf(dragged), 1);
  const insertIndex = ordered.indexOf(target);
  ordered.splice(insertIndex, 0, dragged);

  const updates = {};
  ordered.forEach(([key, val], i) => {
    val.joinedAt = Date.now() + i;
    updates[key] = val;
  });

  const refPath = ref(db, `rooms/${currentRoom}/players`);
  set(refPath, updates);
}
