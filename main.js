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

let currentRoom = document.body.dataset.room || "BH";
let currentUser = null;

const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc"];

const nameButtonsContainer = document.getElementById("nameButtons");
const nameSelectSection = document.getElementById("nameSelect");
const mainScreen = document.getElementById("mainScreen");
const queueDisplay = document.getElementById("queue");
const joinedMessage = document.getElementById("joinedMessage");
const nextUpDiv = document.getElementById("nextUp");
const takenModal = document.getElementById("takenModal");

function renderNameButtons() {
  nameButtonsContainer.innerHTML = "";
  nameList.forEach((name, index) => {
    const btn = document.createElement("button");
    btn.id = `btn-${name}`;
    btn.textContent = name;
    btn.style.backgroundColor = colorList[index % colorList.length];
    btn.onclick = () => attemptJoin(name, colorList[index % colorList.length]);
    btn.className = "w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-sm shadow hover:opacity-80";
    nameButtonsContainer.appendChild(btn);
  });

  db.ref("rooms").on("value", (snapshot) => {
    const allRooms = snapshot.val() || {};
    const takenNames = new Set();

    Object.values(allRooms).forEach(room => {
      Object.keys(room.players || {}).forEach(name => {
        takenNames.add(name);
      });
    });

    nameList.forEach(name => {
      const btn = document.getElementById(`btn-${name}`);
      if (takenNames.has(name)) {
        btn.classList.add("hidden");
      } else {
        btn.classList.remove("hidden");
      }
    });
  });
}

function attemptJoin(name, color) {
  const userRef = db.ref(`rooms/${currentRoom}/players/${name}`);
  userRef.once("value", (snapshot) => {
    if (snapshot.exists()) {
      if (takenModal) takenModal.classList.remove("hidden");
    } else {
      joinWithName(name, color);
    }
  });
}

function closeModal() {
  if (takenModal) takenModal.classList.add("hidden");
}

function joinWithName(name, color) {
  const joinedAt = Date.now();
  currentUser = { name, color, active: true, skip: false, joinedAt, room: currentRoom };

  db.ref(`rooms/${currentRoom}/players/${name}`).set(currentUser);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  nameSelectSection.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  joinedMessage.textContent = `Welcome, ${name}!`;

  db.ref(`rooms/${currentRoom}/players`).on("value", snapshot => {
    updateDisplay(snapshot.val());
  });
}

function updateDisplay(playersMap) {
  const allPlayers = Object.values(playersMap || {});
  const activePlayers = allPlayers.filter(p => p.active && !p.skip).sort((a, b) => a.joinedAt - b.joinedAt);
  const sortedPlayers = allPlayers.sort((a, b) => a.joinedAt - b.joinedAt);
  const next = activePlayers[0];

  nextUpDiv.innerHTML = next
    ? `<div class="font-bold">Next: <span style="color:${next.color}">${next.name}</span></div>`
    : "No one";

  // FLIP animation: Capture first positions
  const oldPositions = {};
  document.querySelectorAll(".player").forEach(el => {
    oldPositions[el.dataset.name] = el.getBoundingClientRect();
  });

  // Clear queue display
  queueDisplay.innerHTML = "";

  // Rebuild with updated order
  sortedPlayers.forEach(p => {
    let badgeColor = "bg-green-600", status = "Active";
    if (p.skip) {
      badgeColor = "bg-yellow-500";
      status = "With Customer";
    }
    if (!p.active) {
      badgeColor = "bg-red-500";
      status = "Out of Rotation";
    }

    const div = document.createElement("div");
    div.className = "flex items-center justify-between bg-white p-3 rounded shadow player";
    div.dataset.name = p.name;
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="inline-block w-4 h-4 rounded-full" style="background-color: ${p.color}"></span>
        <span>${p.name}</span>
      </div>
      <span class="text-xs text-white px-2 py-1 rounded ${badgeColor}">${status}</span>
    `;

    queueDisplay.appendChild(div);
  });

  // FLIP animation: Capture new positions and animate
  const newPositions = {};
  document.querySelectorAll(".player").forEach(el => {
    const name = el.dataset.name;
    newPositions[name] = el.getBoundingClientRect();
  });

  document.querySelectorAll(".player").forEach(el => {
    const name = el.dataset.name;
    const oldPos = oldPositions[name];
    const newPos = newPositions[name];
    if (oldPos) {
      const dx = oldPos.left - newPos.left;
      const dy = oldPos.top - newPos.top;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = "transform 0s";
      requestAnimationFrame(() => {
        el.style.transform = "";
        el.style.transition = "transform 300ms ease";
      });
    }
  });
}

function setStatus(type) {
  if (!currentUser) return;
  const userRef = db.ref(`rooms/${currentRoom}/players/${currentUser.name}`);
  if (type === "active" || type === "skip") {
    userRef.update({
      active: true,
      skip: type === "skip",
      joinedAt: Date.now()
    });
  } else if (type === "inactive") {
    userRef.update({ active: false, skip: false });
  }
}

function leaveGame() {
  if (!currentUser) return;
  db.ref(`rooms/${currentRoom}/players/${currentUser.name}`).remove();
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

window.addEventListener("load", () => {
  const savedUser = JSON.parse(localStorage.getItem("currentUser"));
  if (savedUser && savedUser.name && savedUser.color && savedUser.room) {
    currentUser = savedUser;
    currentRoom = savedUser.room;

    nameSelectSection.classList.add("hidden");
    mainScreen.classList.remove("hidden");
    joinedMessage.textContent = `Welcome back, ${currentUser.name}!`;

    const userRef = db.ref(`rooms/${currentRoom}/players/${currentUser.name}`);
    userRef.once("value", (snapshot) => {
      if (!snapshot.exists()) {
        db.ref(`rooms/${currentRoom}/players/${currentUser.name}`).set(currentUser);
      }
    });

    db.ref(`rooms/${currentRoom}/players`).on("value", snapshot => {
      updateDisplay(snapshot.val());
    });
  }
});

renderNameButtons();
