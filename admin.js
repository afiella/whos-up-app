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
let currentRoom = null;
let currentPlayers = {};

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
  const playersRef = ref(db, `rooms/${room}/players`);
  onValue(playersRef, (snapshot) => {
    const data = snapshot.val() || {};
    currentPlayers = data;
    renderPlayers(data);
  });
};

function renderPlayers(data) {
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";

  Object.entries(data).forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = "flex items-center justify-between bg-white p-3 rounded shadow";

    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full" style="background:${player.color}"></div>
        <span class="font-semibold">${player.name}</span>
      </div>
      <div class="flex gap-2">
        <button onclick="removePlayer('${currentRoom}', '${key}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Remove</button>
        <button onclick="setWithCustomer('${currentRoom}', '${key}')" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm">With Customer</button>
        <button onclick="skipPlayer('${currentRoom}', '${key}')" class="bg-orange-500 text-white px-2 py-1 rounded text-sm">Skip Turn</button>
      </div>
    `;
    playerList.appendChild(div);
  });

  document.getElementById("reorderBtn").classList.remove("hidden");
}

window.removePlayer = (room, key) => {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  remove(playerRef);
};

window.skipPlayer = (room, key) => {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, { skip: true });
};

window.setWithCustomer = (room, key) => {
  const playerRef = ref(db, `rooms/${room}/players/${key}`);
  update(playerRef, {
    active: true,
    skip: true,
    joinedAt: Date.now()
  });
};

window.reorderQueue = () => {
  if (!currentRoom || !currentPlayers) return;

  const currentOrder = Object.keys(currentPlayers).join(", ");
  const promptText = `Enter the new order of names separated by commas:\n(current: ${currentOrder})`;
  const input = prompt(promptText);

  if (!input) return;

  const nameOrder = input.split(",").map(n => n.trim()).filter(n => n);
  const now = Date.now();

  nameOrder.forEach((name, i) => {
    const player = currentPlayers[name];
    if (player) {
      const newJoinedAt = now + i;
      const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
      update(playerRef, { joinedAt: newJoinedAt });
    }
  });

  const msg = document.createElement("div");
  msg.textContent = "Queue updated!";
  msg.className = "text-green-600 font-semibold text-center mt-4";
  document.getElementById("playerList").appendChild(msg);

  setTimeout(() => msg.remove(), 2000);
};
