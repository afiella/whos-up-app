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
  const input = document.getElementById("adminPassword").value.trim().toLowerCase();

  if (input === "bhmod") {
    currentRoom = "BH";
  } else if (input === "59mod") {
    currentRoom = "59";
  } else {
    alert("Incorrect moderator password.");
    return;
  }

  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");
  roomTitle.textContent = `Room: ${currentRoom}`;
  reorderToggle.classList.remove("hidden");
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

    div.querySelector(".player-header").addEventListener("click", () => {
      div.classList.toggle("expanded");
    });

    if (reorderMode) {
      div.addEventListener("dragstart", handleDragStart);
      div.addEventListener("dragover", handleDragOver);
      div.addEventListener("dragleave", handleDragLeave);
      div.addEventListener("drop", handleDrop);
      div.addEventListener("dragend", handleDragEnd);

      div.addEventListener("touchstart", handleTouchStart, { passive: true });
      div.addEventListener("touchmove", handleTouchMove, { passive: false });
      div.addEventListener("touchend", handleTouchEnd);
    }

    playerList.appendChild(div);
  });
}

let draggedKey = null;
let ghost = null;

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

  const now = Date.now();
  const updates = {};
  ordered.forEach(([key, val], i) => {
    updates[key] = { ...val, joinedAt: now + i };
  });

  set(ref(db, `rooms/${currentRoom}/players`), updates);
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
  displayPlayers(latestSnapshot);
};

// Touch Support
let touchDraggingKey = null;

function handleTouchStart(e) {
  touchDraggingKey = this.dataset.key;
  this.classList.add("dragging");

  ghost = this.cloneNode(true);
  ghost.style.position = "absolute";
  ghost.style.top = `${e.touches[0].clientY}px`;
  ghost.style.left = `${e.touches[0].clientX}px`;
  ghost.style.zIndex = 9999;
  ghost.style.pointerEvents = "none";
  ghost.style.width = `${this.offsetWidth}px`;
  ghost.classList.add("opacity-50", "scale-95");

  document.body.appendChild(ghost);
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  ghost.style.top = `${touch.clientY - 30}px`;
  ghost.style.left = `${touch.clientX - 100}px`;

  document.querySelectorAll(".draggable").forEach((el) => {
    el.classList.remove("drag-over");
  });

  const over = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".draggable");
  if (over) {
    over.classList.add("drag-over");
  }
}

function handleTouchEnd(e) {
  const touch = e.changedTouches[0];
  const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".draggable");

  if (touchDraggingKey && dropTarget) {
    reorderPlayers(touchDraggingKey, dropTarget.dataset.key);
  }

  document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
  document.querySelectorAll(".dragging").forEach(el => el.classList.remove("dragging"));

  if (ghost) {
    ghost.remove();
    ghost = null;
  }

  touchDraggingKey = null;
}
