/**
 * Generate and verify 50 unique levels for ZenStars and write to src/levels.js
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

function partition(size) {
  const g = Array.from({ length: size }, () => Array(size).fill(-1));
  const seeds = [];
  for (let i = 0; i < size; i++) {
    let r, c;
    do {
      r = Math.floor(Math.random() * size);
      c = Math.floor(Math.random() * size);
    } while (g[r][c] !== -1);
    g[r][c] = i;
    seeds.push([r, c]);
  }

  let filled = size;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let iters = 0;
  while (filled < size * size && iters < 5000) {
    iters++;
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (g[r][c] !== -1) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && g[nr][nc] === -1) {
          g[nr][nc] = g[r][c];
          filled++;
        }
      }
    }
  }

  // Any stray cells
  if (filled < size * size) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (g[r][c] === -1) {
          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && g[nr][nc] !== -1) {
              g[r][c] = g[nr][nc];
              filled++;
              break;
            }
          }
        }
      }
    }
  }

  // Check connectivity of every zone
  const zoneCells = Array.from({ length: size }, () => []);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      zoneCells[g[r][c]].push([r, c]);
    }
  }

  for (let i = 0; i < size; i++) {
    if (zoneCells[i].length === 0 || !isConnected(zoneCells[i])) {
      return null;
    }
  }

  return g;
}

function findUniqueLevel(size, K = 1, maxAttempts = 20000) {
  for (let i = 0; i < maxAttempts; i++) {
    const zones = partition(size);
    if (!zones) continue;

    const level = { size, starsPerUnit: K, zones };
    const solutions = StarSolver.solve(level, 2);
    if (solutions && solutions.length === 1) {
      return { zones, solution: solutions[0] };
    }
  }
  return null;
}

const PACK_CONFIG = [
  {
    pack: 1,
    name: 'Dawn Novas',
    size: 5,
    starsPerUnit: 1,
    levelNames: [
      'Lyra Spark', 'Vega Dawn', 'Altair Rise', 'Deneb Crest', 'Cygnus Glow',
      'Orion Shimmer', 'Rigel Ray', 'Betelgeuse Flare', 'Bellatrix Beam', 'Saiph Pulse'
    ]
  },
  {
    pack: 2,
    name: 'Astral Runes',
    size: 6,
    starsPerUnit: 1,
    levelNames: [
      'Sirius Gleam', 'Procyon Arc', 'Castor Twin', 'Pollux Light', 'Capella Rune',
      'Aldebaran Eye', 'Pleiades Cluster', 'Hyades Drift', 'Algol Echo', 'Perseus Blade'
    ]
  },
  {
    pack: 3,
    name: 'Sacred Nebula',
    size: 7,
    starsPerUnit: 1,
    levelNames: [
      'Helix Mist', 'Carina Veil', 'Tarantula Web', 'Eagle Pillar', 'Lagoon Flow',
      'Trifid Bloom', 'Rosette Petal', 'Crab Remnant', 'Ring Horizon', 'Orion Core'
    ]
  },
  {
    pack: 4,
    name: 'Celestial Constellations',
    size: 8,
    starsPerUnit: 1,
    levelNames: [
      'Cassiopeia Throne', 'Andromeda Spire', 'Pegasus Wing', 'Ursa Major Dipper', 'Draco Coil',
      'Aquila Talon', 'Scorpius Heart', 'Sagittarius Arrow', 'Centaurus Reach', 'Phoenix Flame'
    ]
  },
  {
    pack: 5,
    name: 'Cosmic Galaxies',
    size: 9,
    starsPerUnit: 1,
    levelNames: [
      'Milky Spiral', 'Sombrero Disk', 'Whirlpool Vortex', 'Triangulum Halo', 'Pinwheel Swirl',
      'Centaurus A', 'Cartwheel Ring', 'Cigar Jet', 'Sunflower Orbit', 'Cosmic Infinity'
    ]
  }
];

async function generateAll() {
  console.log('Generating 50 solver-verified levels for ZenStars...');
  const allLevels = [];
  let globalId = 1;

  for (const pack of PACK_CONFIG) {
    console.log(`Generating Pack ${pack.pack}: ${pack.name} (${pack.size}x${pack.size})...`);
    for (let i = 0; i < 10; i++) {
      const levelName = pack.levelNames[i];
      const t0 = Date.now();
      const res = findUniqueLevel(pack.size, pack.starsPerUnit);
      if (!res) {
        throw new Error(`Failed to generate unique level for ${levelName}`);
      }
      const duration = Date.now() - t0;
      console.log(`  Level ${globalId}: "${levelName}" generated in ${duration}ms (unique solution verified).`);

      allLevels.push({
        id: globalId,
        pack: pack.pack,
        packName: pack.name,
        name: levelName,
        size: pack.size,
        starsPerUnit: pack.starsPerUnit,
        zones: res.zones,
        solution: res.solution
      });
      globalId++;
    }
  }

  const fileContent = `/**
 * ZenStars Handcrafted & Solver-Verified 50 Puzzle Levels
 * 5 Packs of 10 levels each (5x5 to 9x9 grids, 1 star per row/col/zone).
 * Every level is verified to have exactly ONE unique solution.
 */

const ZEN_STARS_LEVELS = ${JSON.stringify(allLevels, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZEN_STARS_LEVELS };
}
`;

  const outputPath = path.join(__dirname, '..', 'src', 'levels.js');
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`Successfully generated and wrote 50 levels to ${outputPath}!`);
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
