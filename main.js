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

const room = window.location.pathname.includes("bh") ? "BH" : "59";
const allRooms = ["BH", "59"];
const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colors = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc"];

let takenNames = new Set();
let currentUser = null;

const nameContainer = document.getElementById("nameButtons");
const nameSection = document.getElementById("nameSelect");
const mainScreen = document.getElementById("mainScreen");
const joinedMessage = document.getElementById("joinedMessage");
const queueDiv = document.getElementById("queue");
const nextUpDiv = document.getElementById("nextUp");

function renderNames() {
  nameContainer.innerHTML = "";
  nameList.forEach((name, i) => {
    if (takenNames.has(name)) return;

    const btn = document.createElement("button");
    btn.textContent = name;
    btn.className = "px-3 py-2 rounded-full text-white font-semibold";
    btn.style.backgroundColor = colors[i % colors.length];
    btn.onclick = () => joinPlayer(name, colors[i % colors.length]);
    nameContainer.appendChild(btn);
  });
}

function showTakenModal() {
  document.getElementById("takenModal").classList.remove("hidden");
}

function hideTakenModal() {
  document.getElementById("takenModal").classList.add("hidden");
}

function joinPlayer(name, color) {
  if (takenNames.has(name)) return showTakenModal();

  const now = Date.now();
  const userData = {
    name,
    color,
    active: true,
    skip: false,
    joinedAt: now
  };

  currentUser = userData;
  localStorage.setItem("currentUser", JSON.stringify(userData));

  db.ref(`rooms/${room}/players/${name}`).set(userData);
  nameSection.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  joinedMessage.textContent = `Welcome, ${name}!`;

  listenForQueueUpdates();
}

function listenForQueueUpdates() {
  db.ref(`rooms/${room}/players`).on("value", (snapshot) => {
    const players = snapshot.val() || {};
    updateQueueDisplay(players);
  });
}

function updateQueueDisplay(players) {
  const activePlayers = Object.values(players).filter(p => p.active && !p.skip);
  activePlayers.sort((a, b) => a.joinedAt - b.joinedAt);

  queueDiv.innerHTML = "";
  activePlayers.forEach((p) => {
    const div = document.createElement("div");
    div.className = "player player-enter bg-white p-3 rounded shadow";
    div.style.backgroundColor = p.color;
    div.innerHTML = `<strong class="text-white">${p.name}</strong>`;
    queueDiv.appendChild(div);
    requestAnimationFrame(() => {
      div.classList.remove("player-enter");
      div.classList.add("player-enter-active");
    });
  });

  const next = activePlayers[0];
  nextUpDiv.innerHTML = next
    ? `<span class="font-semibold text-blue-600">${next.name}</span>`
    : `<span class="text-gray-400">No one</span>`;
}

function setStatus(action) {
  if (!currentUser) return;
  const ref = db.ref(`rooms/${room}/players/${currentUser.name}`);
  const updateData = { active: action === "active", skip: action === "skip", joinedAt: Date.now() };
  if (action === "inactive") updateData.active = false;
  ref.update(updateData);
  Object.assign(currentUser, updateData);
}

function leaveGame() {
  db.ref(`rooms/${room}/players/${currentUser.name}`).remove();
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

function checkTakenNames() {
  allRooms.forEach(r => {
    db.ref(`rooms/${r}/players`).on("value", snapshot => {
      const data = snapshot.val() || {};
      takenNames = new Set(Object.keys(data));
      renderNames();
    });
  });
}

document.getElementById("closeModal").addEventListener("click", hideTakenModal);

checkTakenNames();
