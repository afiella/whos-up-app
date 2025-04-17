// public/scripts/main.js
import { db } from './firebase.js';
import { updateDisplay } from './uiRenderer.js';

let currentRoom = document.body.dataset.room || "BH";
let currentUser = null;

const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc"];

const nameButtonsContainer = document.getElementById("nameButtons");
const nameSelectSection = document.getElementById("nameSelect");
const mainScreen = document.getElementById("mainScreen");
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

function joinWithName(name, color) {
  const joinedAt = Date.now();
  currentUser = { name, color, active: true, skip: false, joinedAt, room: currentRoom };

  db.ref(`rooms/${currentRoom}/players/${name}`).set(currentUser);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  nameSelectSection.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  joinedMessage.textContent = `Welcome, ${name}!`;

  db.ref(`rooms/${currentRoom}/players`).on("value", snapshot => {
    updateDisplay(snapshot.val(), currentUser, nextUpDiv);
  });
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
      updateDisplay(snapshot.val(), currentUser, nextUpDiv);
    });
  }
});

renderNameButtons();

window.leaveGame = function () {
  if (!currentUser) return;
  db.ref(`rooms/${currentRoom}/players/${currentUser.name}`).remove();
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
};

window.setStatus = function (type) {
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
};

window.closeModal = function () {
  if (takenModal) takenModal.classList.add("hidden");
};

window.switchRoom = function () {
  if (!currentUser) return;
  const newRoom = currentRoom === "59" ? "BH" : "59";
  const confirmSwitch = confirm(`Switch to the ${newRoom} Room?`);
  if (confirmSwitch) {
    db.ref(`rooms/${currentRoom}/players/${currentUser.name}`).remove();
    const updatedUser = { ...currentUser, room: newRoom };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    window.location.href = newRoom.toLowerCase() + ".html";
  }
};
