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
  "#2f4156", "#567c8d", "#c8d9e6", "#66066", "#8c5a7f", "#adb3bc",
  "#794044", "#d195b2", "#f9cb9c", "#420420", "#81d8d0", "#ede1bc", "#888888"
];

let currentRoom = window.location.pathname.includes("bh") ? "BH" : "59";
let currentUser = null;

const nameButtonsContainer = document.getElementById("nameButtons");
const nameSelectSection = document.getElementById("nameSelect");
const mainScreen = document.getElementById("mainScreen");
const queueDisplay = document.getElementById("queue");
const joinedMessage = document.getElementById("joinedMessage");
const nextUpDiv = document.getElementById("nextUp");

function renderNameButtons() {
  nameButtonsContainer.innerHTML = "";

  db.ref(`rooms/${currentRoom}/players`).once("value").then(snapshot => {
    const existingPlayers = snapshot.val() || {};
    const takenNames = Object.keys(existingPlayers);

    nameList.forEach((name, i) => {
      const btn = document.createElement("button");
      const isTaken = takenNames.includes(name);

      btn.textContent = name;
      btn.className = `px-3 py-1 rounded-full w-24 h-24 text-white font-medium text-sm shadow ${
        isTaken ? "opacity-50 cursor-not-allowed bg-gray-400" : ""
      }`;
      btn.style.backgroundColor = isTaken ? "#d1d5db" : colorList[i % colorList.length];
      btn.disabled = isTaken;

      if (!isTaken) {
        btn.onclick = () => selectName(name, colorList[i % colorList.length]);
      }

      nameButtonsContainer.appendChild(btn);
    });
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
    updateDisplay(data);
  });
}

function updateDisplay(playersMap) {
  const allPlayers = Object.values(playersMap || {});
  const activePlayers = allPlayers
    .filter(p => p.active && !p.skip)
    .sort((a, b) => a.joinedAt - b.joinedAt);

  queueDisplay.innerHTML = "";

  allPlayers
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .forEach((p) => {
      let status = "Active";
      let badgeColor = "bg-green-500";

      if (!p.active) {
        status = "Out";
        badgeColor = "bg-red-500";
      } else if (p.skip) {
        status = "With Customer";
        badgeColor = "bg-yellow-500";
      }

      const div = document.createElement("div");
      div.innerHTML = `
        <div class="flex items-center justify-between p-2 bg-white rounded shadow">
          <div class="flex items-center gap-2">
            <span class="inline-block w-4 h-4 rounded-full" style="background-color: ${p.color}"></span>
            <span class="font-medium">${p.name}</span>
          </div>
          <span class="text-xs text-white px-2 py-1 rounded ${badgeColor}">${status}</span>
        </div>
      `;
      queueDisplay.appendChild(div);
    });

  const next = activePlayers[0];
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

  const userRef = db.ref(`rooms/${currentRoom}/players/${currentUser.name}`);

  if (action === "active" || action === "skip") {
    const updates = {
      active: true,
      skip: action === "skip",
      joinedAt: Date.now()
    };
    userRef.update(updates);
    currentUser = { ...currentUser, ...updates };
  }

  if (action === "inactive") {
    const updates = {
      active: false,
      skip: false
    };
    userRef.update(updates);
    currentUser = { ...currentUser, ...updates };
  }
}

function leaveGame() {
  if (!currentUser) return;
  db.ref(`rooms/${currentRoom}/players/${currentUser.name}`).remove();
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

renderNameButtons();
