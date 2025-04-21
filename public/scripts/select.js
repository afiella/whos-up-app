import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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

const nameInput = document.getElementById("nameInput");

// Convert to full title case (e.g., "ella osei" => "Ella Osei")
function toTitleCase(str) {
  return str
    .split(" ")
    .filter(word => word.length)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Handle join function
window.handleJoin = async function (room) {
  const rawName = nameInput.value.trim();
  if (!rawName) {
    alert("Please enter a name.");
    return;
  }

  const formattedName = toTitleCase(rawName);

  const playerRef = ref(db, `rooms/${room}/players/${formattedName}`);
  const snapshot = await get(playerRef);

  if (snapshot.exists() && !snapshot.val()?.ghost) {
    alert("That name is already taken!");
    return;
  }

  const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc", "#b9a3e3"];
  const color = colorList[Math.floor(Math.random() * colorList.length)];

  const newPlayerData = {
    name: formattedName,
    color,
    active: true,
    skip: false,
    ghost: false,
    joinedAt: Date.now()
  };

  if (snapshot.exists() && snapshot.val().ghost) {
    await update(playerRef, newPlayerData);
  } else {
    await set(playerRef, newPlayerData);
  }

  localStorage.setItem("currentUser", JSON.stringify({ name: formattedName, color, room }));

  // redirect to proper room
  if (room === "BH") {
    window.location.href = "bh.html";
  } else if (room === "59") {
    window.location.href = "59.html";
  }
};
