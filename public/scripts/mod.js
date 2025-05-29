// ---- CSS Rules (add to your main stylesheet) ----
/*
#roomSelector {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
#roomSelector button {
  margin: 0 1rem;
  padding: 0.5rem 1rem;
  font-size: 1.25rem;
}
.sortable-ghost { opacity: 0.5; }
.sortable-fallback { opacity: 0.7; z-index: 1000; position: relative; }
.drag-handle, .player-item { user-select: none; touch-action: none; cursor: grab; }
*/

// ---- JavaScript (mod.js) ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  set,
  get
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/modular/sortable.esm.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDkEKUzUhc-nKFLnF1w0MOm6qwpKHTpfaI",
  authDomain: "who-s-up-app.firebaseapp.com",
  databaseURL: "https://who-s-up-app-default-rtdb.firebaseio.com",
  projectId: "who-s-up-app",
  storageBucket: "who-s-up-app.appspot.com",
  messagingSenderId: "167292375113",
  appId: "1:167292157113:web:ce718a1aab4852fe5daf98"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// State
let currentRoom;
let reorderMode = false;
let latestSnapshot = {};
let sortableInstance = null;

const nameList = ["Archie","Ella","Veronica","Dan","Alex","Adam","Darryl","Michael","Tia","Rob","Jeremy","Nassir","Malachi","Greg"];
const colorList = ["#2f4156","#567c8d","#c8d9e6","#f5efeb","#8c5a7f","#adb3bc","#4697df","#d195b2","#f9cb9c","#88afb7","#bdcccf","#ede1bc","#b9a3e3"];

// Helper function to convert to title case
function toTitleCase(str) {
  return str
    .split(" ")
    .filter(word => word.length)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

document.addEventListener("DOMContentLoaded", () => {
  // Create room selector UI
  const selector = document.createElement('div');
  selector.id = 'roomSelector';
  selector.innerHTML = `
    <button id="selectBH">Moderate BH</button>
    <button id="select59">Moderate 59</button>
  `;
  document.body.appendChild(selector);

  document.getElementById('selectBH').addEventListener('click', () => initModerator('BH'));
  document.getElementById('select59').addEventListener('click', () => initModerator('59'));

  function initModerator(room) {
    currentRoom = room;
    selector.remove();
    setupModerator();
  }

  function setupModerator() {
    const roomTitle     = document.getElementById("roomTitle");
    const currentNextUp = document.getElementById("currentNextUp");
    const playerList    = document.getElementById("playerList");
    const ghostNameInput = document.getElementById("ghostNameInput");
    const reorderToggle = document.getElementById("reorderToggle");

    roomTitle.textContent = `Room: ${currentRoom}`;

    // Listen to room
    const playersRef = ref(db, `rooms/${currentRoom}/players`);
    onValue(playersRef, snap => {
      latestSnapshot = snap.val() || {};
      renderPlayers(latestSnapshot);
    });

    reorderToggle.addEventListener('click', () => {
      reorderMode = !reorderMode;
      reorderToggle.textContent = reorderMode ? 'Finish Reordering' : 'Enable Reorder Mode';
      if (reorderMode) initSortable();
      else if (sortableInstance) sortableInstance.destroy();
    });

    function renderPlayers(data) {
      playerList.innerHTML = '';
      const entries = Object.entries(data).sort((a,b) => a[1].joinedAt - b[1].joinedAt);
      const active = entries.filter(([_,p]) => p.active && !p.skip);
      const skip   = entries.filter(([_,p]) => p.active && p.skip);
      const out    = entries.filter(([_,p]) => !p.active);
      const combined = [...active, ...skip, ...out];

      currentNextUp.textContent = active[0]
        ? `Next Up: ${active[0][1].name}`
        : "Next Up: —";

      combined.forEach(([key, player]) => {
        const div = document.createElement('div');
        div.className = `player-item bg-white rounded shadow px-4 py-3 transition-all ${player.ghost? 'opacity-50 italic':''}`;
        div.dataset.key = key;

        let status='Out', badge='bg-red-500';
        if (player.active && !player.skip)      { status='Active'; badge='bg-green-500'; }
        else if (player.active && player.skip)  { status='With Customer'; badge='bg-yellow-500'; }

        div.innerHTML = `
          <div class="flex items-center justify-between player-header cursor-pointer">
            <div class="flex items-center gap-2">
              <span class="drag-handle w-4 h-4 text-xl cursor-grab">☰</span>
              <span class="font-semibold">${player.name}</span>
              ${player.ghost ? '<span class="text-xs text-gray-500 ml-2">(Ghost)</span>' : ''}
            </div>
            <span class="text-sm text-white px-2 py-1 rounded ${badge}">${status}</span>
          </div>
          <div class="action-buttons mt-3 space-y-2 ${player.ghost?'hidden':''}">
            <div class="flex justify-between">
              <button onclick="setStatus('${key}','active')" class="btn-green">In</button>
              <button onclick="setStatus('${key}','skip')"   class="btn-yellow">Customer</button>
              <button onclick="setStatus('${key}','inactive')" class="btn-gray">Out</button>
            </div>
            <div class="text-center">
              <button onclick="removePlayer('${key}')" class="text-red-600 font-bold">✕ Remove</button>
            </div>
          </div>`;

        div.querySelector('.player-header')
           .addEventListener('click', ()=>div.classList.toggle('expanded'));

        playerList.appendChild(div);
      });

      if (sortableInstance) { sortableInstance.destroy(); sortableInstance=null; }
      if (reorderMode) initSortable();
    }

    window.setStatus = (key,status) => {
      const updateRef = ref(db, `rooms/${currentRoom}/players/${key}`);
      const updates = status==='active'
        ? {active:true,skip:false,joinedAt:Date.now()}
        : status==='skip'
          ? {active:true,skip:true,joinedAt:Date.now()}
          : {active:false,skip:false};
      update(updateRef, updates);
    };

    window.removePlayer = key =>
      remove(ref(db, `rooms/${currentRoom}/players/${key}`));

    // Add Ghost Player - Updated to accept any name
    window.addGhostPlayer = async () => {
      const rawName = ghostNameInput.value.trim();
      if (!rawName) {
        alert("Please enter a name for the ghost player");
        return;
      }
      
      const name = toTitleCase(rawName);
      
      // Check if player already exists
      const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
      const snapshot = await get(playerRef);
      
      if (snapshot.exists()) {
        alert(`Player "${name}" already exists in this room`);
        return;
      }
      
      // Get a color - either from the preset list if it's a known name, or random
      const nameIndex = nameList.findIndex(n => n.toLowerCase() === name.toLowerCase());
      const color = nameIndex !== -1 
        ? colorList[nameIndex % colorList.length]
        : colorList[Math.floor(Math.random() * colorList.length)];
      
      set(ref(db, `rooms/${currentRoom}/players/${name}`), {
        name, color, ghost:true, active:true, skip:false, joinedAt:Date.now()
      });
      
      ghostNameInput.value = ""; // Clear the input
    };

    // Join as Player - Updated to accept any name
    window.joinAsPlayer = async () => {
      const inputEl = document.getElementById("adminJoinName");
      if (!inputEl) return;

      const rawInput = inputEl.value.trim();
      if (!rawInput) {
        alert("Please enter a name");
        return;
      }
      
      const name = toTitleCase(rawInput);

      const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
      const snapshot = await get(playerRef);
      const existing = snapshot.exists() ? snapshot.val() : null;

      // Get a color - either from the preset list if it's a known name, or random
      const nameIndex = nameList.findIndex(n => n.toLowerCase() === name.toLowerCase());
      const color = nameIndex !== -1 
        ? colorList[nameIndex % colorList.length]
        : colorList[Math.floor(Math.random() * colorList.length)];

      const playerData = {
        name,
        color,
        ghost: false,
        active: true,
        skip: false,
        joinedAt: Date.now()
      };

      if (existing?.ghost) {
        await update(playerRef, playerData);
      } else if (!existing) {
        await set(playerRef, playerData);
      } else {
        alert("That name is already taken.");
        return;
      }

      alert(`You have joined the ${currentRoom} room as ${name}`);
      inputEl.value = ""; // Clear the input
    };

    function initSortable() {
      sortableInstance = Sortable.create(playerList, {
        handle: '.drag-handle',
        animation: 200,
        forceFallback: true,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        ghostClass: 'sortable-ghost',
        fallbackClass: 'sortable-fallback',
        delay: 150,
        delayOnTouchOnly: true,
        onEnd: evt => {
          const keys = [...playerList.children].map(li => li.dataset.key);
          const now = Date.now();
          const updates = {};
          keys.forEach((k,i) => updates[k] = { ...latestSnapshot[k], joinedAt: now + i });
          set(ref(db, `rooms/${currentRoom}/players`), {
            ...latestSnapshot,
            ...updates
          });
        }
      });
    }
  }
});