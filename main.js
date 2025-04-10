import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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

const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc"];

const currentRoom = window.location.pathname.includes("bh") ? "BH" : "59";
let currentUser = null;

const nameButtonsContainer = document.getElementById("nameButtons");
const nameSelectSection = document.getElementById("nameSelect");
const mainScreen = document.getElementById("mainScreen");

function renderNameButtons(takenNames = []) {
  nameButtonsContainer.innerHTML = "";
  nameList.forEach((name, i) => {
    if (!takenNames.includes(name)) {
      const btn = document.createElement("button");
      btn.textContent = name;
      btn.className = "px-4 py-2 rounded-full text-white font-medium transition-all duration-300 ease-in-out transform hover:scale-105";
      btn.style.backgroundColor = colorList[i % colorList.length];
      btn.onclick = () => selectName(name, colorList[i % colorList.length]);
      nameButtonsContainer.appendChild(btn);
    }
  });
}

function selectName(name, color) {
  const joinedAt = Date.now();
  currentUser = { name, color, active: true, skip: false, joinedAt };
  set(ref(db, `rooms/${currentRoom}/players/${name}`), currentUser);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  nameSelectSection.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  document.getElementById("joinedMessage").textContent = `Welcome, ${name}!`;
}

function leaveGame() {
  if (!currentUser) return;
  remove(ref(db, `rooms/${currentRoom}/players/${currentUser.name}`));
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// Monitor both rooms and disable taken names globally
function monitorTakenNames() {
  const bhRef = ref(db, "rooms/BH/players");
  const room59Ref = ref(db, "rooms/59/players");

  onValue(bhRef, (bhSnap) => {
    onValue(room59Ref, (r59Snap) => {
      const bhNames = Object.keys(bhSnap.val() || {});
      const r59Names = Object.keys(r59Snap.val() || {});
      const taken = [...new Set([...bhNames, ...r59Names])];
      renderNameButtons(taken);
    });
  });
}

monitorTakenNames();
