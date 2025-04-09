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

const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir"];
const colorList = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#10b981", "#f472b6"];

let currentRoom = window.location.pathname.includes("bh") ? "BH" : "59";
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  renderDropdowns();
  listenToQueue();
});

function renderDropdowns() {
  const nameDropdown = document.getElementById("nameSelectDropdown");
  const colorDropdown = document.getElementById("colorSelectDropdown");

  nameList.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    nameDropdown.appendChild(option);
  });

  colorList.forEach(color => {
    const option = document.createElement("option");
    option.value = color;
    option.textContent = color;
    option.style.backgroundColor = color;
    colorDropdown.appendChild(option);
  });
}

function joinRoom() {
  const name = document.getElementById("nameSelectDropdown").value;
  const color = document.getElementById("colorSelectDropdown").value;

  if (!name || !color) return alert("Please select both name and color.");

  currentUser = { name, color, active: true };
  db.ref(`rooms/${currentRoom}/players/${name}`).set(currentUser);

  document.getElementById("nameSelect").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
  document.getElementById("joinedMessage").textContent = `Welcome, ${name}!`;
}

function toggleStatus(isActive) {
  if (!currentUser) return;
  db.ref(`rooms/${currentRoom}/players/${currentUser.name}`).update({ active: isActive });
}

function listenToQueue() {
  db.ref(`rooms/${currentRoom}/players`).on("value", (snapshot) => {
    const players = snapshot.val() || {};
    const activePlayers = Object.values(players).filter(p => p.active);
    const queueDiv = document.getElementById("queue");

    queueDiv.innerHTML = "";
    activePlayers.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "px-4 py-2 rounded text-white font-semibold";
      div.style.backgroundColor = p.color;
      div.textContent = `${i + 1}. ${p.name}`;
      queueDiv.appendChild(div);
    });

    document.getElementById("nextUp").textContent = activePlayers[0]?.name || "No one";
  });
}