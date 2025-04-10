import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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

  const playersRef = ref(db, `rooms/${room}/players`);
  onValue(playersRef, (snapshot) => {
    const data = snapshot.val() || {};
    const playerList = document.getElementById("playerList");
    playerList.innerHTML = "";

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
      div.className = "flex items-center justify-between bg-white p-3 rounded shadow";

      div.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full" style="background:${player.color}"></div>
          <span class="font-semibold">${player.name}</span>
          <span class="text-xs text-white px-2 py-1 rounded ${badgeColor}">${status}</span>
        </div>
        <div class="flex gap-2">
          <button onclick="removePlayer('${room}', '${key}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Remove</button>
          <button onclick="skipPlayer('${room}', '${key}')" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm">With Customer</button>
          <button onclick="setActive('${room}', '${key}')" class="bg-green-500 text-white px-2 py-1 rounded text-sm">Back In</button>
          <button onclick="setInactive('${room}', '${key}')" class="bg-gray-500 text-white px-2 py-1 rounded text-sm">Out of Rotation</button>
        </div>
      `;
      playerList.appendChild(div);
    });
  });
};

window.removePlayer = function (room, key) {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  remove(playerRef);
};

window.skipPlayer = function (room, key) {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, {
    active: true,
    skip: true,
    joinedAt: Date.now()
  });
};

window.setActive = function (room, key) {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, {
    active: true,
    skip: false,
    joinedAt: Date.now()
  });
};

window.setInactive = function (room, key) {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, {
    active: false,
    skip: false
  });
};

window.reorderQueue = function () {
  if (!currentRoom) return;
  const newOrderInput = prompt("Enter names in the desired order, separated by commas:");
  if (!newOrderInput) return;

  const names = newOrderInput.split(",").map(name => name.trim()).filter(Boolean);
  const playersRef = ref(db, `rooms/${currentRoom}/players`);

  onValue(playersRef, (snapshot) => {
    const data = snapshot.val() || {};
    const updates = {};
    let timestamp = Date.now();

    names.forEach((name, index) => {
      const player = data[name];
      if (player) {
        updates[name] = {
          ...player,
          joinedAt: timestamp + index
        };
      }
    });

    set(playersRef, { ...data, ...updates });
    alert("Queue updated!");
  }, { onlyOnce: true });
};
