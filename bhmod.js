import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove
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

const room = "BH";
const roomTitle = document.getElementById("roomTitle");
const playerList = document.getElementById("playerList");

window.checkModPassword = function () {
  const input = document.getElementById("modPassword").value.trim();
  if (input === "bhmod") {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("modPanel").classList.remove("hidden");
    loadRoom();
  } else {
    alert("Incorrect password");
  }
};

function loadRoom() {
  roomTitle.textContent = `Room: ${room}`;
  const playersRef = ref(db, `rooms/${room}/players`);
  onValue(playersRef, (snapshot) => {
    const players = snapshot.val() || {};
    renderPlayers(players);
  });
}

function renderPlayers(players) {
  playerList.innerHTML = "";
  const sorted = Object.entries(players).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt
  );

  sorted.forEach(([name, player]) => {
    let status = "Active";
    let badge = "bg-green-500";
    if (!player.active) {
      status = "Out";
      badge = "bg-red-500";
    } else if (player.skip) {
      status = "With Customer";
      badge = "bg-yellow-500";
    }

    const div = document.createElement("div");
    div.className = "bg-white rounded shadow px-4 py-3";
    div.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full" style="background-color: ${player.color}"></span>
          <span class="font-semibold">${name}</span>
          <span class="text-xs px-2 py-1 text-white ${badge} rounded">${status}</span>
        </div>
        <div class="flex gap-2">
          <button onclick="setStatus('${name}', 'active')" class="bg-green-500 text-white px-2 py-1 rounded text-xs">In</button>
          <button onclick="setStatus('${name}', 'skip')" class="bg-yellow-500 text-white px-2 py-1 rounded text-xs">With Customer</button>
          <button onclick="setStatus('${name}', 'inactive')" class="bg-gray-500 text-white px-2 py-1 rounded text-xs">Out</button>
          <button onclick="removePlayer('${name}')" class="bg-red-500 text-white px-2 py-1 rounded text-xs">✕</button>
        </div>
      </div>
    `;
    playerList.appendChild(div);
  });
}

window.setStatus = function (name, type) {
  const playerRef = ref(db, `rooms/${room}/players/${name}`);
  let updates = {};
  if (type === "active") {
    updates = { active: true, skip: false, joinedAt: Date.now() };
  } else if (type === "skip") {
    updates = { active: true, skip: true, joinedAt: Date.now() };
  } else {
    updates = { active: false, skip: false };
  }
  update(playerRef, updates);
};

window.removePlayer = function (name) {
  const playerRef = ref(db, `rooms/${room}/players/${name}`);
  remove(playerRef);
};
