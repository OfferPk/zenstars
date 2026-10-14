/**
 * Level Generator & Verifier for ZenStars
 */

const fs = require('fs');
const path = require('path');
const { StarEngine, StarSolver } = require('../src/star-engine.js');

function isConnected(cells) {
  if (cells.length <= 1) return true;
  const set = new Set(cells.map(c => `${c[0]},${c[1]}`));
  const visited = new Set();
  const queue = [cells[0]];
  visited.add(`${cells[0][0]},${cells[0][1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const key = `${r + dr},${c + dc}`;
      if (set.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push([r + dr, c + dc]);
      }
    }
  }

  return visited.size === cells.length;
}

function generateValidStars(size, K) {
  const stars = [];

  function place(rowIdx) {
    if (rowIdx === size) return true;

    const available = [];
    for (let c = 0; c < size; c++) {
      let ok = true;
      for (const s of stars) {
        if (s.c === c) { ok = false; break; }
        if (Math.abs(s.r - rowIdx) <= 1 && Math.abs(s.c - c) <= 1) {
          ok = false;
          break;
        }
      }
      if (ok) available.push(c);
    }

    available.sort(() => Math.random() - 0.5);

    for (const c of available) {
      stars.push({ r: rowIdx, c });
      if (place(rowIdx + 1)) return true;
      stars.pop();
    }

    return false;
  }

  for (let attempt = 0; attempt < 500; attempt++) {
    stars.length = 0;
    if (place(0)) return stars;
  }
  return null;
}

function generateZonesForStars(size, stars) {
  const grid = Array.from({ length: size }, () => Array(size).fill(-1));
  const zoneCells = Array.from({ length: stars.length }, () => []);

  stars.forEach((star, idx) => {
    grid[star.r][star.c] = idx;
    zoneCells[idx].push([star.r, star.c]);
  });

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let unassigned = size * size - stars.length;

  let iterations = 0;
  while (unassigned > 0 && iterations < 5000) {
    iterations++;
    const zoneIdx = Math.floor(Math.random() * stars.length);
    const cells = zoneCells[zoneIdx];

    const candidates = [];
    for (const [r, c] of cells) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
          candidates.push([nr, nc]);
        }
      }
    }

    if (candidates.length > 0) {
      const [cr, cc] = candidates[Math.floor(Math.random() * candidates.length)];
      grid[cr][cc] = zoneIdx;
      zoneCells[zoneIdx].push([cr, cc]);
      unassigned--;
    }
  }

  if (unassigned > 0) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === -1) {
          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] !== -1) {
              grid[r][c] = grid[nr][nc];
              zoneCells[grid[nr][nc]].push([r, c]);
              unassigned--;
              break;
            }
          }
        }
      }
    }
  }

  for (const cells of zoneCells) {
    if (!isConnected(cells)) return null;
  }

  return grid;
}

function generateUniqueLevel(size, K = 1, maxAttempts = 1000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const stars = generateValidStars(size, K);
    if (!stars) continue;

    const zones = generateZonesForStars(size, stars);
    if (!zones) continue;

    const level = {
      size,
      starsPerUnit: K,
      zones
    };

    const solutions = StarSolver.solve(level, 2);
    if (solutions && solutions.length === 1) {
      return { level, solution: solutions[0] };
    }
  }
  return null;
}

module.exports = { generateUniqueLevel };

for (const sz of [5, 6, 7, 8, 9]) {
  const t0 = Date.now();
  const res = generateUniqueLevel(sz, 1);
  console.log(`Size ${sz}x${sz}:`, !!res, 'Time:', Date.now() - t0, 'ms');
}
