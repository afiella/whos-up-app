import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  update,
  set
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

const nameList = ["Archie", "Ella", "Veronica", "Dan", "Alex", "Adam", "Darryl", "Michael", "Tia", "Rob", "Jeremy", "Nassir", "Greg"];
const colorList = ["#2f4156", "#567c8d", "#c8d9e6", "#f5efeb", "#8c5a7f", "#adb3bc", "#4697df", "#d195b2", "#f9cb9c", "#88afb7", "#bdcccf", "#ede1bc", "#b9a3e3"];

const nameContainer = document.getElementById("nameSelection");
let latestSnapshotBH = {};
let latestSnapshot59 = {};

loadPlayers();

async function loadPlayers() {
  const [bhSnap, r59Snap] = await Promise.all([
    get(ref(db, "rooms/BH/players")),
    get(ref(db, "rooms/59/players"))
  ]);

  latestSnapshotBH = bhSnap.val() || {};
  latestSnapshot59 = r59Snap.val() || {};

  renderNameCircles();
}

function renderNameCircles() {
  nameContainer.innerHTML = "";

  nameList.forEach((name, i) => {
    const color = colorList[i % colorList.length];
    const bhPlayer = latestSnapshotBH[name];
    const r59Player = latestSnapshot59[name];

    const isTaken = (bhPlayer && !bhPlayer.ghost) || (r59Player && !r59Player.ghost);
    const isGhost = (bhPlayer && bhPlayer.ghost) || (r59Player && r59Player.ghost);

    if (isTaken) return;

    const btn = document.createElement("button");
    btn.className = "name-circle" + (isGhost ? " ghost" : "");
    btn.style.backgroundColor = color;
    btn.textContent = name;
    btn.onclick = () => handleNameClick(name, color);
    nameContainer.appendChild(btn);
  });
}

async function handleNameClick(name, color) {
  const bhRef = ref(db, `rooms/BH/players/${name}`);
  const r59Ref = ref(db, `rooms/59/players/${name}`);

  const [bhSnap, r59Snap] = await Promise.all([get(bhRef), get(r59Ref)]);
  const bhData = bhSnap.exists() ? bhSnap.val() : null;
  const r59Data = r59Snap.exists() ? r59Snap.val() : null;

  const ghostData = bhData?.ghost ? { room: "BH", ref: bhRef } :
                    r59Data?.ghost ? { room: "59", ref: r59Ref } : null;

  if (ghostData) {
    await update(ghostData.ref, {
      ghost: false,
      active: true,
      skip: false,
      joinedAt: Date.now(),
      color
    });

    localStorage.setItem("currentUser", JSON.stringify({
      name,
      color,
      room: ghostData.room
    }));

    window.location.href = `${ghostData.room.toLowerCase()}.html`;
    return;
  }

  if (!bhData && !r59Data) {
    const room = prompt("Which room? (BH or 59)").toUpperCase() === "59" ? "59" : "BH";
    const newRef = ref(db, `rooms/${room}/players/${name}`);
    await set(newRef, {
      name,
      color,
      ghost: false,
      active: true,
      skip: false,
      joinedAt: Date.now()
    });

    localStorage.setItem("currentUser", JSON.stringify({
      name,
      color,
      room
    }));

    window.location.href = `${room.toLowerCase()}.html`;
  } else {
    alert("This name is already taken.");
  }
}