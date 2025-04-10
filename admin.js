import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
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

// Admin password check
window.checkPassword = function () {
  const input = document.getElementById("adminPassword").value.trim();
  if (input === "afia") {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
  } else {
    alert("Incorrect password");
  }
};

// Load players in selected room
window.loadRoom = function (room) {
  document.getElementById("roomTitle").textContent = `Room: ${room}`;
  const playersRef = ref(db, `rooms/${room}/players`);

  onValue(playersRef, (snapshot) => {
    const data = snapshot.val() || {};
    const playerList = document.getElementById("playerList");
    playerList.innerHTML = "";

    // Sort by joinedAt
    const activePlayers = Object.entries(data)
      .filter(([_, p]) => p.active && !p.skip)
      .sort((a, b) => a[1].joinedAt - b[1].joinedAt);

    const nextPlayer = activePlayers.length > 0 ? activePlayers[0][1] : null;
    const currentUp = document.getElementById("currentUp");
    currentUp.textContent = nextPlayer
      ? `Up Next: ${nextPlayer.name}`
      : "No one is currently up.";

    Object.entries(data).forEach(([key, player]) => {
      let status = "Active";
      let badgeColor = "bg-green-500";

      if (!player.active) {
        status = "Out of Rotation";
        badgeColor = "bg-red-500";
      } else if (player.skip) {
        status = "With Customer";
        badgeColor = "bg-yellow-500";
      }

      const div = document.createElement("div");
      div.className =
        "flex items-center justify-between bg-white p-3 rounded shadow";

      div.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full" style="background:${player.color}"></div>
          <span class="font-semibold">${player.name}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-white px-2 py-1 rounded ${badgeColor}">${status}</span>
          <button onclick="removePlayer('${room}', '${key}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Remove</button>
          <button onclick="markSkip('${room}', '${key}')" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm">With Customer</button>
          <button onclick="markBackIn('${room}', '${key}')" class="bg-green-600 text-white px-2 py-1 rounded text-sm">Back In</button>
          <button onclick="markOut('${room}', '${key}')" class="bg-gray-600 text-white px-2 py-1 rounded text-sm">Out</button>
        </div>
      `;
      playerList.appendChild(div);
    });
  });
};

// Admin controls
window.removePlayer = function (room, key) {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  remove(playerRef);
};

window.markSkip = function (room, key) {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, {
    skip: true,
    active: true,
    joinedAt: Date.now()
  });
};

window.markBackIn = function (room, key) {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, {
    active: true,
    skip: false,
    joinedAt: Date.now()
  });
};

window.markOut = function (room, key) {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, {
    active: false,
    skip: false
  });
};
