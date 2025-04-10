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
  appId: "1:167292375113:web:ce718a1aab4852fe5daf98",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const allNames = [
  "Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl",
  "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"
];
const colorPalette = [
  "#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f",
  "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7",
  "#bdcccf", "#ede1bc"
];

let currentRoom = null;

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
  document.getElementById("roomTitle").textContent = `Room: ${room}`;
  document.getElementById("reorderBtn").classList.remove("hidden");
  document.getElementById("manualAdd").classList.remove("hidden");
  const playersRef = ref(db, `rooms/${room}/players`);
  onValue(playersRef, (snapshot) => {
    const data = snapshot.val() || {};
    renderPlayerList(data);
    renderDropdowns(data);
    updateNextUp(data);
  });
};

function renderPlayerList(data) {
  const list = document.getElementById("playerList");
  list.innerHTML = "";

  const players = Object.entries(data || {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  players.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = "flex items-center justify-between bg-white p-3 rounded shadow";

    let status = "Active";
    let badgeColor = "bg-green-500";
    if (player.skip) {
      status = "With Customer";
      badgeColor = "bg-yellow-500";
    }
    if (!player.active) {
      status = "Out";
      badgeColor = "bg-red-500";
    }

    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full" style="background:${player.color}"></div>
        <span class="font-semibold">${player.name}</span>
        <span class="text-xs px-2 py-1 rounded ${badgeColor} text-white">${status}</span>
      </div>
      <div class="flex gap-2">
        <button onclick="removePlayer('${currentRoom}', '${key}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Remove</button>
        <button onclick="skipPlayer('${currentRoom}', '${key}')" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm">With Customer</button>
        <button onclick="backIn('${currentRoom}', '${key}')" class="bg-green-500 text-white px-2 py-1 rounded text-sm">Back In</button>
        <button onclick="markOut('${currentRoom}', '${key}')" class="bg-gray-500 text-white px-2 py-1 rounded text-sm">Out</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function renderDropdowns(data) {
  const takenNames = new Set(Object.keys(data));
  const availableNames = allNames.filter(name => !takenNames.has(name));

  const nameSelect = document.getElementById("addNameSelect");
  nameSelect.innerHTML = availableNames.map(name =>
    `<option value="${name}">${name}</option>`
  ).join("");

  const colorSelect = document.getElementById("addColorSelect");
  colorSelect.innerHTML = colorPalette.map(c =>
    `<option value="${c}" style="background:${c};color:black">${c}</option>`
  ).join("");

  const positionSelect = document.getElementById("addPositionSelect");
  const count = Object.keys(data).length;
  positionSelect.innerHTML = Array.from({ length: count + 1 }, (_, i) =>
    `<option value="${i}">Position ${i + 1}</option>`
  ).join("");
}

function updateNextUp(data) {
  const players = Object.values(data || {})
    .filter(p => p.active && !p.skip)
    .sort((a, b) => a.joinedAt - b.joinedAt);
  const next = players[0];
  document.getElementById("nextUpDisplay").textContent = next?.name || "No one";
}

window.removePlayer = (room, key) => {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  remove(playerRef);
};

window.skipPlayer = (room, key) => {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, { skip: true });
};

window.backIn = (room, key) => {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, { skip: false, active: true, joinedAt: Date.now() });
};

window.markOut = (room, key) => {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, { active: false, skip: false });
};

window.addManualPlayer = async function () {
  const name = document.getElementById("addNameSelect").value;
  const color = document.getElementById("addColorSelect").value;
  const position = parseInt(document.getElementById("addPositionSelect").value);
  const status = document.querySelector('input[name="statusRadio"]:checked')?.value;

  if (!name || !color || isNaN(position)) return alert("Fill out all fields.");

  const snapshot = await get(ref(db, `rooms/${currentRoom}/players`));
  const existing = snapshot.val() || {};

  const ordered = Object.entries(existing).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const before = ordered.slice(0, position);
  const after = ordered.slice(position);

  const timestamp = Date.now();

  const newPlayer = {
    name,
    color,
    joinedAt: timestamp,
    active: status === "active",
    skip: status === "skip"
  };

  const updates = {};
  before.forEach(([k, v]) => updates[k] = v);
  updates[name] = newPlayer;
  after.forEach(([k, v]) => updates[k] = v);

  await set(ref(db, `rooms/${currentRoom}/players`), updates);
  alert(`${name} added to position ${position + 1} in ${currentRoom}`);
};
