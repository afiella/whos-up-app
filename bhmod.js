import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update
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

const currentRoom = "BH"; // Hardcoded for BH moderator
const roomTitle = document.getElementById("roomTitle");
const playerList = document.getElementById("playerList");

window.checkModPassword = () => {
  const input = document.getElementById("modPassword").value.trim();
  if (input === "bhmod") {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("modPanel").classList.remove("hidden");
    roomTitle.textContent = `BH Room Moderator`;
    loadRoom();
  } else {
    alert("Incorrect password");
  }
};

function loadRoom() {
  const playersRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(playersRef, (snapshot) => {
    const players = snapshot.val() || {};
    renderPlayers(players);
  });
}

function renderPlayers(players) {
  playerList.innerHTML = "";
  Object.entries(players)
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt)
    .forEach(([key, player]) => {
      let status = "Active";
      let badgeColor = "bg-green-500";
      if (!player.active) {
        status = "Out";
        badgeColor = "bg-red-500";
      } else if (player.skip) {
        status = "With Customer";
        badgeColor = "bg-yellow-500";
      }

      const div = document.createElement("div");
      div.className = "bg-white rounded shadow px-4 py-3";
      div.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full" style="background:${player.color}"></div>
            <span class="font-semibold">${player.name}</span>
          </div>
          <span class="text-xs px-2 py-1 rounded text-white ${badgeColor}">${status}</span>
        </div>
        <div class="flex justify-between mt-2 text-sm">
          <button onclick="setPlayerStatus('${key}', 'active')" class="bg-green-500 text-white px-2 py-1 rounded">In</button>
          <button onclick="setPlayerStatus('${key}', 'skip')" class="bg-yellow-500 text-white px-2 py-1 rounded">With Customer</button>
          <button onclick="setPlayerStatus('${key}', 'inactive')" class="bg-gray-600 text-white px-2 py-1 rounded">Out</button>
        </div>
      `;
      playerList.appendChild(div);
    });
}

window.setPlayerStatus = (key, type) => {
  const playerRef = ref(db, `rooms/${currentRoom}/players/${key}`);
  const updates = {
    active: type === "active" || type === "skip",
    skip: type === "skip",
    joinedAt: Date.now()
  };
  if (type === "inactive") {
    updates.active = false;
    updates.skip = false;
  }
  update(playerRef, updates);
};
