import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  update,
  set
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// --- Firebase Config ---
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

// --- Room from Query ---
const params = new URLSearchParams(window.location.search);
const currentRoom = params.get("room");

if (!currentRoom || (currentRoom !== "BH" && currentRoom !== "59")) {
  alert("No valid room selected. Redirecting...");
  window.location.href = "index.html";
}

const nameContainer = document.getElementById("nameSelection");
const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc", "#b9a3e3"];

loadPlayers();

async function loadPlayers() {
  const roomRef = ref(db, `rooms/${currentRoom}/players`);
  const snapshot = await get(roomRef);
  const players = snapshot.val() || {};
  renderNameCircles(players);
}

function renderNameCircles(players) {
  nameContainer.innerHTML = "";

  nameList.forEach((name, i) => {
    const color = colorList[i % colorList.length];
    const player = players[name];

    const isTaken = player && !player.ghost;
    const isGhost = player && player.ghost;

    if (isTaken) return;

    const btn = document.createElement("button");
    btn.className = "name-circle" + (isGhost ? " ghost" : "");
    btn.style.backgroundColor = color;
    btn.textContent = name;
    btn.onclick = () => handleNameClick(name, color);
    nameContainer.appendChild(btn);
  });
}

async function handleNameClick(name, color) {
  const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  const snapshot = await get(playerRef);
  const existing = snapshot.exists() ? snapshot.val() : null;

  const userData = {
    name,
    color,
    ghost: false,
    active: true,
    skip: false,
    joinedAt: Date.now()
  };

  if (existing?.ghost) {
    await update(playerRef, userData);
  } else {
    await set(playerRef, userData);
  }

  localStorage.setItem("currentUser", JSON.stringify({
    name,
    color,
    room: currentRoom
  }));

  window.location.href = `${currentRoom.toLowerCase()}.html`;
}