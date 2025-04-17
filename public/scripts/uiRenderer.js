// public/scripts/uiRenderer.js
export function updateDisplay(playersMap, currentUser, nextUpDiv) {
    const allPlayers = Object.values(playersMap || {});
    const activePlayers = allPlayers.filter(p => p.active && !p.skip).sort((a, b) => a.joinedAt - b.joinedAt);
    const skipPlayers = allPlayers.filter(p => p.active && p.skip).sort((a, b) => a.joinedAt - b.joinedAt);
    const outPlayers = allPlayers.filter(p => !p.active).sort((a, b) => a.joinedAt - b.joinedAt);
  
    const next = activePlayers[0];
    nextUpDiv.innerHTML = next
      ? `<div class="font-bold text-blue-600">Next: <span style="color:${next.color}">${next.name}</span></div>`
      : `<div class="font-bold text-blue-600">No one</div>`;
  
    document.getElementById("activePlayers").innerHTML = "";
    document.getElementById("skipPlayers").innerHTML = "";
    document.getElementById("outPlayers").innerHTML = "";
  
    renderGroup(activePlayers, "activePlayers", "bg-green-600", "Active");
    renderGroup(skipPlayers, "skipPlayers", "bg-yellow-500", "With Customer");
    renderGroup(outPlayers, "outPlayers", "bg-red-500", "Out of Rotation");
  }
  
  function renderGroup(group, containerId, badgeColor, statusLabel) {
    const container = document.getElementById(containerId);
    group.forEach(p => {
      const div = document.createElement("div");
      div.className = "flex items-center justify-between bg-white p-3 rounded shadow player transition-all duration-300 ease-in-out";
      div.dataset.name = p.name;
      div.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="inline-block w-4 h-4 rounded-full" style="background-color: ${p.color}"></span>
          <span class="text-lg font-semibold">${p.name}</span>
        </div>
        <span class="text-xs text-white px-2 py-1 rounded ${badgeColor}">${statusLabel}</span>
      `;
      container.appendChild(div);
    });
  }
  