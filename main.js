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
  "Archie", "Ella", "Veronica", "Dan", "Alex",
  "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir"
];

const colorList = [
  "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa",
  "#f472b6", "#10b981", "#fb923c", "#4ade80", "#facc15"
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
  nameList.forEach(name => {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.className = "bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600";
    btn.onclick = () => selectName(name);
    nameButtonsContainer.appendChild(btn);
  });
}

function selectName(name) {
  const color = colorList[Math.floor(Math.random() * colorList.length)];
  currentUser = { name, color };
  const userRef = db.ref(`rooms/${currentRoom}/players/${name}`);
  userRef.set({ name, color, active: true });

  nameSelectSection.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  joinedMessage.textContent = `You've joined as ${name}!`;
}

function toggleStatus(isJoining) {
  if (!currentUser) return;
  const userRef = db.ref(`rooms/${currentRoom}/players/${currentUser.name}`);
  userRef.update({ active: isJoining });
}

db.ref(`rooms/${currentRoom}/players`).on("value", (snapshot) => {
  const players = snapshot.val() || {};
  const activePlayers = Object.values(players).filter(p => p.active);
  queueDisplay.innerHTML = "";

  activePlayers.forEach((player, index) => {
    const div = document.createElement("div");
    div.className = "flex items-center gap-2";
    div.innerHTML = `
      <div class="w-6 h-6 rounded-full" style="background:${player.color}"></div>
      <span class="text-sm">${index + 1}. ${player.name}</span>
    `;
    queueDisplay.appendChild(div);
  });
});

renderNameButtons();