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

// Include SortableJS in HTML:
// <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>

let currentRoom = null;
let latestSnapshot = {};
let sortableInstance = null;

// DOM refs
document.addEventListener('DOMContentLoaded', () => {
  const roomTitle = document.getElementById("roomTitle");
  const playerList = document.getElementById("playerList");
  const reorderToggle = document.getElementById("reorderToggle");

  // Moderator login
  window.checkPassword = () => { /* existing login logic */ };

  // Room listener\ n  function listenToRoom() { /* existing onValue logic */ }
  
  // Player display (simplified)  
  function displayPlayers(data) {
    playerList.innerHTML = '';
    const entries = Object.entries(data).sort((a,b) => a[1].joinedAt - b[1].joinedAt);
    entries.forEach(([key, player]) => {
      const div = document.createElement('div');
      div.className = 'player-item';
      div.dataset.key = key;
      div.innerHTML = `<span class="drag-handle">☰</span> ${player.name}`;
      playerList.appendChild(div);
    });
  }

  // Listen
  function initRoom() {
    const playersRef = ref(db, `rooms/${currentRoom}/players`);
    onValue(playersRef, snapshot => {
      latestSnapshot = snapshot.val() || {};
      displayPlayers(latestSnapshot);
    });
  }

  // Toggle reorder using SortableJS\ n  reorderToggle.addEventListener('click', () => {
    if (!sortableInstance) {
      reorderToggle.textContent = 'Finish Reordering';
      sortableInstance = Sortable.create(playerList, {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: evt => {
          const orderedKeys = [...playerList.children].map(li => li.dataset.key);
          const now = Date.now();
          const updates = {};
          orderedKeys.forEach((key, i) => {
            updates[key] = { ...latestSnapshot[key], joinedAt: now + i };
          });
          set(ref(db, `rooms/${currentRoom}/players`), { ...latestSnapshot, ...updates });
        }
      });
    } else {
      sortableInstance.destroy();
      sortableInstance = null;
      reorderToggle.textContent = 'Enable Reorder Mode';
    }
  });
