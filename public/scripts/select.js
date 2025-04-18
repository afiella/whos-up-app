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

// --- Get room from URL ---
const params = new URLSearchParams(window.location.search);
const currentRoom = params.get("room");
if (!currentRoom || (currentRoom !== "BH" && currentRoom !== "59")) {
  alert("No valid room selected.");
  window.location.href = "index.html";
}

const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc", "#b9a3e3"];

const nameCircles = document.getElementById("nameCircles");
const joinButton = document.getElementById("joinButton");

let players = {};

loadPlayers();

async function loadPlayers() {
  const snapshot = await get(ref(db, `rooms/${currentRoom}/players`));
  players = snapshot.val() || {};
  renderCircles();
}

function renderCircles() {
  nameCircles.innerHTML = "";

  nameList.forEach((name, i) => {
    const player = players[name];
    const isGhost = player?.ghost;
    const isTaken = player && !player.ghost;

    const div = document.createElement("div");
    div.className = "name-circle";
    if (isGhost) div.classList.add("ghost");

    div.style.backgroundColor = colorList[i % colorList.length];
    div.textContent = name;
    nameCircles.appendChild(div);
  });
}

joinButton.addEventListener("click", async () => {
  const input = document.getElementById("nameInput").value.trim();
  const name = nameList.find(n => n.toLowerCase() === input.toLowerCase());

  if (!name) {
    alert("Please enter a valid name from the list.");
    return;
  }

  const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  const snap = await get(playerRef);
  const existing = snap.exists() ? snap.val() : null;
  const index = nameList.indexOf(name);
  const color = colorList[index % colorList.length];

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
  } else if (!existing) {
    await set(playerRef, userData);
  } else {
    alert("That name is already taken.");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify({
    name,
    color,
    room: currentRoom
  }));

  window.location.href = `${currentRoom.toLowerCase()}.html`;
});