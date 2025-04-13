<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Panel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .player-card {
      transition: all 0.3s ease-in-out;
    }
    .dragging {
      opacity: 0.5;
    }
    .drag-over {
      border: 2px dashed #3b82f6;
      background-color: #eff6ff;
    }
    .floating-header {
      position: sticky;
      top: 0;
      z-index: 10;
      background-color: #f8fafc;
      padding: 0.5rem 1rem;
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen p-4">
  <div class="max-w-3xl mx-auto">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold">Admin Control Panel</h1>
      <div class="mt-2">
        <button onclick="switchRoom('BH')" class="bg-blue-600 text-white px-4 py-2 rounded mr-2">View BH</button>
        <button onclick="switchRoom('59')" class="bg-purple-600 text-white px-4 py-2 rounded">View 59</button>
      </div>
      <p class="text-sm mt-2 text-gray-600" id="roomTitle">Room: </p>
      <p class="text-sm text-blue-600" id="currentNextUp"></p>
    </div>

    <div class="text-center mb-4">
      <button onclick="toggleReorderMode()" id="reorderToggle" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        Enable Reorder Mode
      </button>
    </div>

    <!-- Sections -->
    <div id="activeSection" class="mb-8">
      <h2 class="floating-header text-green-700 text-lg font-semibold mb-2">Active Players</h2>
      <div id="activePlayers" class="space-y-2"></div>
    </div>

    <div id="skipSection" class="mb-8">
      <h2 class="floating-header text-yellow-600 text-lg font-semibold mb-2">With Customer</h2>
      <div id="skipPlayers" class="space-y-2"></div>
    </div>

    <div id="outSection" class="mb-8">
      <h2 class="floating-header text-red-600 text-lg font-semibold mb-2">Out of Rotation</h2>
      <div id="outPlayers" class="space-y-2"></div>
    </div>

    <div class="text-center">
      <button onclick="resetAllPlayers()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
        Reset All Players
      </button>
    </div>

    <div class="mt-6 text-center">
      <a href="index.html" class="text-sm text-blue-600 underline">← Back to Landing Page</a>
    </div>
  </div>

  <script type="module" src="admin.js"></script>
</body>
</html>
