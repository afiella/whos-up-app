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

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDkEKUzUhc-nKFLnF1w0MOm6qwpKHTpfaI",
  authDomain: "who-s-up-app.firebaseapp.com",
  databaseURL: "https://who-s-up-app-default-rtdb.firebaseio.com",
  projectId: "who-s-up-app",
  storageBucket: "who-s-up-app.appspot.com",
  messagingSenderId: "167292375113",
  appId: "1:167292375113:web:ce718a1aab4852fe5daf98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Include SortableJS in your HTML:
// <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>

// State variables
let currentRoom = null;
let reorderMode = false;
let latestSnapshot = {};

// DOM references
document.addEventListener('DOMContentLoaded', () => {
  const roomTitle = document.getElementById("roomTitle");
  const currentNextUp = document.getElementById("currentNextUp");
  const playerList = document.getElementById("playerList");
  const ghostDropdown = document.getElementById("ghostNameSelect");
  const reorderToggle = document.getElementById("reorderToggle");
  let sortableInstance = null;

  // Allowed names + colors
  const nameList = ["Archie","Ella","Veronica","Dan","Alex","Adam","Darryl","Michael","Tia","Rob","Jeremy","Nassir","Greg"];
  const colorList = ["#2f4156","#567c8d","#c8d9e6","#f5efeb","#8c5a7f","#adb3bc","#4697df","#d195b2","#f9cb9c","#88afb7","#bdcccf","#ede1bc","#b9a3e3"];

  // Login logic
  window.checkPassword = function () {
    const input = document.getElementById("modPassword").value.trim().toLowerCase();
    if (input === "bhmod") currentRoom = "BH";
    else if (input === "59mod") currentRoom = "59";
    else { alert("Incorrect moderator password."); return; }

    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("modPanel").classList.remove("hidden");
    roomTitle.textContent = `Room: ${currentRoom}`;
    listenToRoom();
  };

  // Listen to Firebase room updates
  function listenToRoom() {
    const playersRef = ref(db, `rooms/${currentRoom}/players`);
    onValue(playersRef, snapshot => {
      latestSnapshot = snapshot.val() || {};
      renderPlayers(latestSnapshot);
      updateGhostDropdown(latestSnapshot);
    });
  }

  // Render player list
  function renderPlayers(data) {
    // Clear
    playerList.innerHTML = '';
    // Sort by joinedAt
    const entries = Object.entries(data).sort((a,b) => a[1].joinedAt - b[1].joinedAt);
    const active = entries.filter(([_,p]) => p.active && !p.skip);
    const skip = entries.filter(([_,p]) => p.active && p.skip);
    const out = entries.filter(([_,p]) => !p.active);
    const combined = [...active, ...skip, ...out];

    // Update next-up display
    currentNextUp.textContent = active[0] ? `Next Up: ${active[0][1].name}` : 'Next Up: —';

    // Create elements
    combined.forEach(([key, player]) => {
      const div = document.createElement('div');
      div.className = `player-item bg-white rounded shadow px-4 py-3 transition-all ${player.ghost? 'opacity-50 italic':''}`;
      div.dataset.key = key;

      // Player header & status
      let status = 'Out', badge='bg-red-500';
      if (player.active && !player.skip) { status='Active'; badge='bg-green-500'; }
      else if (player.active && player.skip) { status='With Customer'; badge='bg-yellow-500'; }

      div.innerHTML = `
        <div class="flex items-center justify-between player-header cursor-pointer">
          <div class="flex items-center gap-2">
            <span class="drag-handle w-4 h-4 text-xl cursor-grab">☰</span>
            <span class="font-semibold">${player.name}</span>
          </div>
          <span class="text-sm text-white px-2 py-1 rounded ${badge}">${status}</span>
        </div>
        <div class="action-buttons mt-3 space-y-2 ${player.ghost? 'hidden':''}">
          <div class="flex justify-between">
            <button onclick="setStatus('${key}','active')" class="btn-green">In</button>
            <button onclick="setStatus('${key}','skip')" class="btn-yellow">Customer</button>
            <button onclick="setStatus('${key}','inactive')" class="btn-gray">Out</button>
          </div>
          <div class="text-center">
            <button onclick="removePlayer('${key}')" class="text-red-600 font-bold">✕ Remove</button>
          </div>
        </div>
      `;

      // Toggle details
      div.querySelector('.player-header').addEventListener('click', ()=> div.classList.toggle('expanded'));

      playerList.appendChild(div);
    });

    // Re-init Sortable if in reorder mode
    if (sortableInstance) sortableInstance.destroy();
    if (reorderMode) initSortable();
  }

  // Status and removal functions
  window.setStatus = (key,status) => {
    const updateRef = ref(db, `rooms/${currentRoom}/players/${key}`);
    const updates = status==='active'? {active:true,skip:false,joinedAt:Date.now()} : status==='skip'? {active:true,skip:true,joinedAt:Date.now()} : {active:false,skip:false};
    update(updateRef, updates);
  };
  window.removePlayer = key => remove(ref(db, `rooms/${currentRoom}/players/${key}`));

  // Ghost dropdown
  function updateGhostDropdown(players) {
    ghostDropdown.innerHTML='';
    nameList.forEach((name,i)=>{
      if (!players[name]||players[name].ghost) {
        const opt=document.createElement('option'); opt.value=name; opt.textContent=name;
        ghostDropdown.appendChild(opt);
      }
    });
  }
  window.addGhostPlayer = () => {
    const name=ghostDropdown.value; if(!name)return;
    const color=colorList[nameList.indexOf(name)%colorList.length];
    set(ref(db, `rooms/${currentRoom}/players/${name}`),{name,color,ghost:true,active:true,skip:false,joinedAt:Date.now()});
  };

  // Toggle reorder mode
  reorderToggle.addEventListener('click', ()=>{
    reorderMode = !reorderMode;
    reorderToggle.textContent = reorderMode ? 'Finish Reordering' : 'Enable Reorder Mode';
    if (reorderMode) initSortable(); else if (sortableInstance) sortableInstance.destroy();
  });

  // Initialize SortableJS
  function initSortable() {
    sortableInstance = Sortable.create(playerList, {
      handle: '.drag-handle',
      animation: 200,
      ghostClass: 'sortable-ghost',
      onEnd: evt => {
        const orderedKeys = [...playerList.children].map(li=>li.dataset.key);
        const now=Date.now(); const updates={};
        orderedKeys.forEach((key,i)=> updates[key]={...latestSnapshot[key],joinedAt:now+i});
        set(ref(db, `rooms/${currentRoom}/players`),{...latestSnapshot,...updates});
      }
    });
  }

  // Join as mod
  window.joinAsPlayer = async()=>{/* existing join logic */};

});
