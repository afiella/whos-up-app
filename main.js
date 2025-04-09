const firebaseConfig = {
  apiKey: "AIzaSyDkEKUzUhc-nKFLnF1w0MOm6qwpKHTpfaI",
  authDomain: "who-s-up-app.firebaseapp.com",
  databaseURL: "https://who-s-up-app-default-rtdb.firebaseio.com",
  projectId: "who-s-up-app",
  storageBucket: "who-s-up-app.appspot.com",
  messagingSenderId: "167292375113",
  appId: "1:167292375113:web:ce718a1aab4852fe5daf98"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const nameList = [
  "Archie", "Ella", "Veronica", "Dan", "Alex", "Adam",
  "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir"
];

const colorList = [
  "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa",
  "#f472b6", "#10b981", "#fb923c", "#4ade80", "#93c5fd",
  "#facc15", "#f472b6"
];

let currentRoom = window.location.pathname.includes("bh") ? "BH" : "59";
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  const nameButtons = document.getElementById("nameButtons");
  const mainScreen = document.getElementById("mainScreen");
  const nameSelect = document.getElementById("nameSelect");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const currentNextUp = document.getElementById("currentNextUp");
  const queueDiv = document.getElementById("queue");

  if (!nameButtons || !mainScreen || !nameSelect || !welcomeMsg || !currentNextUp || !queueDiv) {
    console.warn("Missing required DOM elements for the queue app.");
    return;
  }

  // Create name buttons
  nameButtons.innerHTML = "";
  nameList.forEach((name, i) => {
    const btn = document.createElement("button");
    btn.className = "w-16 h-16 rounded-full text-white font-bold";
    btn.style.backgroundColor = colorList[i];
    btn.textContent = name;
    btn.onclick = () => joinQueue(name, colorList[i]);
    nameButtons.appendChild(btn);
  });

  // Listen to database changes
  const playersRef = db.ref(`rooms/${currentRoom}/players`);
  playersRef.on("value", (snapshot) => {
    const data = snapshot.val() || {};
    const players = Object.values(data).filter(p => p.active);
    queueDiv.innerHTML = "";
    currentNextUp.textContent = players[0]?.name || "No one";

    players.forEach(p => {
      const div = document.createElement("div");
      div.className = "py-1 px-2 rounded text-white font-semibold";
      div.style.backgroundColor = p.color;
      div.textContent = p.name;
      queueDiv.appendChild(div);
    });
  });
});

function joinQueue(name, color) {
  currentUser = name;
  db.ref(`rooms/${currentRoom}/players/${name}`).set({
    name,
    color,
    active: true
  });

  const nameSelect = document.getElementById("nameSelect");
  const mainScreen = document.getElementById("mainScreen");
  const welcomeMsg = document.getElementById("welcomeMsg");

  if (nameSelect) nameSelect.classList.add("hidden");
  if (mainScreen) mainScreen.classList.remove("hidden");
  if (welcomeMsg) welcomeMsg.textContent = `Welcome, ${name}!`;
}

function toggleStatus(isJoining) {
  if (!currentUser || !currentRoom) return;
  db.ref(`rooms/${currentRoom}/players/${currentUser}`).update({ active: isJoining });
}
