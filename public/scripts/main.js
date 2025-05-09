import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  set,
  remove,
  get
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

const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc", "#b9a3e3"];

const currentRoom = document.body.dataset.room;
const playerName = JSON.parse(localStorage.getItem("currentUser") || "{}")?.name;
const playerColor = JSON.parse(localStorage.getItem("currentUser") || "{}")?.color;

const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");

const nameSelect = document.getElementById("nameSelect");
const mainScreen = document.getElementById("mainScreen");
const joinedMessage = document.getElementById("joinedMessage");
const nextUp = document.getElementById("nextUp");

const activePlayers = document.getElementById("activePlayers");
const skipPlayers = document.getElementById("skipPlayers");
const outPlayers = document.getElementById("outPlayers");

// If player already joined
if (playerName && currentRoom) {
  nameSelect?.classList.add("hidden");
  mainScreen?.classList.remove("hidden");
  joinedMessage.textContent = `You joined as ${playerName}`;
  listenToRoom();
}

joinBtn?.addEventListener("click", async () => {
  const name = nameInput.value.trim();

  if (!name) {
    alert("Please enter a name");
    return;
  }

  const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  const snap = await get(playerRef);

  if (snap.exists() && !snap.val().ghost) {
    alert("Name is already taken!");
    return;
  }

  const color = colorList[Math.floor(Math.random() * colorList.length)];

  const newData = {
    name,
    color,
    active: true,
    skip: false,
    ghost: false,
    joinedAt: Date.now()
  };

  if (snap.exists() && snap.val().ghost) {
    await update(playerRef, newData);
  } else {
    await set(playerRef, newData);
  }

  localStorage.setItem("currentUser", JSON.stringify({ name, color, room: currentRoom }));
  location.reload();
});

function listenToRoom() {
  const roomRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(roomRef, (snapshot) => {
    const players = snapshot.val() || {};
    renderQueues(players);
  });
}

function renderQueues(players) {
  const entries = Object.entries(players).sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  const active = entries.filter(([_, p]) => p.active && !p.skip);
  const skip = entries.filter(([_, p]) => p.active && p.skip);
  const out = entries.filter(([_, p]) => !p.active);

  nextUp.textContent = active[0] ? `Next: ${active[0][1].name}` : "";

  renderSection(activePlayers, active);
  renderSection(skipPlayers, skip);
  renderSection(outPlayers, out);
}

function renderSection(container, players) {
  container.innerHTML = "";
  players.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.textContent = player.name;
    div.className = `px-3 py-1 rounded ${
      player.ghost ? "ghost-tag" : "bg-gray-200"
    }`;
    container.appendChild(div);
  });
}

window.setStatus = function (status) {
  const refPath = ref(db, `rooms/${currentRoom}/players/${playerName}`);
  const updates =
    status === "active"
      ? { active: true, skip: false, joinedAt: Date.now() }
      : status === "skip"
      ? { active: true, skip: true, joinedAt: Date.now() }
      : { active: false, skip: false };

  update(refPath, updates);
};

window.leaveGame = async function () {
  const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
  if (!stored?.name || !stored?.room) {
    window.location.href = "index.html";
    return;
  }

  const playerRef = ref(db, `rooms/${stored.room}/players/${stored.name}`);
  await remove(playerRef);

  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
};
