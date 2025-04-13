// admin.js
// Displays both BH and 59 rooms on the same page side-by-side.

// 1) Import from Firebase (v11)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// 2) Firebase config & initialization
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

// 3) DOM references for BH
const bhNextUpEl = document.getElementById("bhNextUp");
const bhActiveEl = document.getElementById("bhActive");
const bhSkipEl   = document.getElementById("bhSkip");
const bhOutEl    = document.getElementById("bhOut");

// 4) DOM references for 59
const f59NextUpEl = document.getElementById("fiftyNineNextUp");
const f59ActiveEl = document.getElementById("fiftyNineActive");
const f59SkipEl   = document.getElementById("fiftyNineSkip");
const f59OutEl    = document.getElementById("fiftyNineOut");

// 5) Listen to BH
const bhRef = ref(db, "rooms/BH/players");
onValue(bhRef, (snapshot) => {
  const data = snapshot.val() || {};
  updateUI(
    data,
    bhNextUpEl,
    bhActiveEl,
    bhSkipEl,
    bhOutEl
  );
});

// 6) Listen to 59
const f59Ref = ref(db, "rooms/59/players");
onValue(f59Ref, (snapshot) => {
  const data = snapshot.val() || {};
  updateUI(
    data,
    f59NextUpEl,
    f59ActiveEl,
    f59SkipEl,
    f59OutEl
  );
});

/**
 * @param {Object} playersMap The object from Realtime DB
 * @param {Element} nextUpEl  DOM element for "Next Up" label
 * @param {Element} activeEl  Container for Active players
 * @param {Element} skipEl    Container for With Customer
 * @param {Element} outEl     Container for Out
 */
function updateUI(playersMap, nextUpEl, activeEl, skipEl, outEl) {
  // Convert to array, sort by joinedAt
  const entries = Object.entries(playersMap).sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  // Partition
  const activePlayers = entries.filter(([_, p]) => p.active && !p.skip);
  const skipPlayers   = entries.filter(([_, p]) => p.active && p.skip);
  const outPlayers    = entries.filter(([_, p]) => !p.active);

  // Next Up
  const firstActive = activePlayers[0]?.[1];
  nextUpEl.textContent = firstActive
    ? `Next: ${firstActive.name}`
    : "Next: None";

  // Clear containers
  activeEl.innerHTML = "";
  skipEl.innerHTML   = "";
  outEl.innerHTML    = "";

  // Render each group
  renderGroup(activePlayers, activeEl, "bg-green-600", "In");
  renderGroup(skipPlayers, skipEl, "bg-yellow-600", "Customer");
  renderGroup(outPlayers,  outEl,  "bg-gray-600",   "Out");
}

/**
 * Renders a list of players into the given container
 * @param {Array} group Array of [key, playerObj]
 * @param {Element} container DOM element to hold players
 * @param {String} badgeClass Tailwind classes for styling
 * @param {String} label Label to show on the colored badge
 */
function renderGroup(group, container, badgeClass, label) {
  group.forEach(([key, player]) => {
    const div = document.createElement("div");
    div.className = "flex items-center justify-between bg-white p-3 rounded shadow";
    div.dataset.key = key;
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="inline-block w-4 h-4 rounded-full" style="background-color: ${player.color || "#ccc"}"></span>
        <span class="font-semibold">${player.name}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-white px-2 py-1 rounded ${badgeClass}">${label}</span>
        <button class="text-green-600 text-sm" onclick="setStatus('${key}','active')">In</button>
        <button class="text-yellow-600 text-sm" onclick="setStatus('${key}','skip')">Customer</button>
        <button class="text-gray-600 text-sm" onclick="setStatus('${key}','inactive')">Out</button>
        <button class="text-red-600 text-sm" onclick="removePlayer('${key}')">✕</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// 7) Functions to set status or remove player
window.setStatus = function(key, type) {
  // We need to figure out if the key is in BH or 59
  const pathBH = `rooms/BH/players/${key}`;
  const path59 = `rooms/59/players/${key}`;

  const updates =
    (type === "active")
      ? { active: true, skip: false, joinedAt: Date.now() }
      : (type === "skip")
      ? { active: true, skip: true, joinedAt: Date.now() }
      : { active: false, skip: false }; // 'inactive'

  // Check if player is in BH
  ref(db, pathBH).once("value").then((snap) => {
    if (snap.exists()) {
      update(ref(db, pathBH), updates);
    } else {
      // otherwise, assume 59
      ref(db, path59).once("value").then((snap59) => {
        if (snap59.exists()) {
          update(ref(db, path59), updates);
        } else {
          console.warn("Player not found in BH or 59 for key:", key);
        }
      });
    }
  });
};

window.removePlayer = function(key) {
  const pathBH = `rooms/BH/players/${key}`;
  const path59 = `rooms/59/players/${key}`;

  // Check BH first
  ref(db, pathBH).once("value").then((snap) => {
    if (snap.exists()) {
      remove(ref(db, pathBH));
    } else {
      // check 59
      ref(db, path59).once("value").then((snap59) => {
        if (snap59.exists()) {
          remove(ref(db, path59));
        } else {
          console.warn("Player not found in BH or 59 for removal:", key);
        }
      });
    }
  });
};

// 8) Reset both rooms
const resetBtn = document.getElementById("resetBothRooms");
resetBtn.addEventListener("click", () => {
  set(ref(db, "rooms/BH/players"), {});
  set(ref(db, "rooms/59/players"), {});
});
