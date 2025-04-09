const firebaseConfig = {
  apiKey: "AIzaSyDkEKUzUhc-nKFLnF1w0MOm6qwpKHTpfaI",
  authDomain: "who-s-up-app.firebaseapp.com",
  databaseURL: "https://who-s-up-app-default-rtdb.firebaseio.com",
  projectId: "who-s-up-app",
  storageBucket: "who-s-up-app.appspot.com",
  messagingSenderId: "167292375113",
  appId: "1:167292375113:web:ce718a1aab4852fe5daf98",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colorList = [
  "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa",
  "#f472b6", "#10b981", "#fb923c", "#4ade80", "#facc15", "#e879f9", "#38bdf8"
];

let currentRoom = window.location.pathname.includes("bh") ? "BH" : "59";
let currentUser = null;

const nameButtonsContainer = document.getElementById("nameButtons");
const nameSelectSection = document.getElementById("nameSelect");
const mainScreen = document.getElementById("mainScreen");
const queueDisplay = document.getElementById("queue");
const joinedMessage = document.getElementById("joinedMessage");

function renderNameButtons() {
  nameButtonsContainer.innerHTML = "";
  nameList.forEach((name, i) => {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.className = "px-3 py-1 rounded text-white font-medium";
    btn.style.backgroundColor = colorList[i % colorList.length];
    btn.onclick = () => selectName(name, colorList[i % colorList.length]);
    nameButtonsContainer.appendChild(btn);
  });
}

function selectName(name, color) {
  const joinedAt = Date.now();
  currentUser = { name, color, active: true, skip: false, joinedAt };
  db.ref(`rooms/${currentRoom}/players/${name}`).set(currentUser);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  nameSelectSection.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  joinedMessage.textContent = `Welcome, ${name}!`;

  db.ref(`rooms/${currentRoom}/players`).on("value", snapshot => {
    const data = snapshot.val() || {};
    const activePlayers = Object.values(data)
      .filter(p => p.active && !p.skip)
      .sort((a, b) => a.joinedAt - b.joinedAt);
    updateDisplay(activePlayers);
  });
}

function updateDisplay(players) {
  queueDisplay.innerHTML = "";
  players.forEach((p, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="inline-block w-4 h-4 rounded-full" style="background-color: ${p.color}"></span>
        <span>${i + 1}. ${p.name}</span>
      </div>
    `;
    queueDisplay.appendChild(div);
  });

  const next = players[0];
  const nextUpDiv = document.getElementById("nextUp");
  nextUpDiv.innerHTML = next
    ? `
      <div class="flex items-center justify-center gap-2">
        <span class="inline-block w-4 h-4 rounded-full" style="background-color: ${next.color}"></span>
        <span class="font-semibold">${next.name}</span>
      </div>
    `
    : "No one";
}

function setStatus(action) {
  if (!currentUser) return;

  const updates = {
    active: action === "active",
    skip: action === "skip"
  };

  db.ref(`rooms/${currentRoom}/players/${currentUser.name}`).update(updates);
}

renderNameButtons();