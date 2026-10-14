/**
 * ZenStars Game Engine & Constraint-Propagation Solver
 * Implements Star Battle (Queens / Two Not Touch) celestial grid logic.
 */

const CELL_STATE = {
  EMPTY: 0,
  DOT: 1,
  STAR: 2
};

class StarEngine {
  constructor(levelData) {
    this.id = levelData.id;
    this.name = levelData.name || `Nova ${levelData.id}`;
    this.pack = levelData.pack || 1;
    this.size = levelData.size; // N x N
    this.starsPerUnit = levelData.starsPerUnit || 1; // K
    this.zones = levelData.zones; // 2D array [size][size] of zone ids (0 to zoneCount-1)
    this.zoneCount = levelData.zoneCount || levelData.size;
    this.targetStars = this.size * this.starsPerUnit;

    // Board state: 0 = empty, 1 = dot/mark, 2 = star
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(CELL_STATE.EMPTY));
    this.history = [];
    this.moveCount = 0;
  }

  getCell(r, c) {
    if (r < 0 || r >= this.size || c < 0 || c >= this.size) return null;
    return this.board[r][c];
  }

  getZone(r, c) {
    if (r < 0 || r >= this.size || c < 0 || c >= this.size) return -1;
    return this.zones[r][c];
  }

  cycleCell(r, c) {
    const current = this.getCell(r, c);
    if (current === null) return { success: false };

    let nextState;
    if (current === CELL_STATE.EMPTY) {
      nextState = CELL_STATE.DOT;
    } else if (current === CELL_STATE.DOT) {
      nextState = CELL_STATE.STAR;
    } else {
      nextState = CELL_STATE.EMPTY;
    }

    return this.setCellState(r, c, nextState);
  }

  setCellState(r, c, newState) {
    const prevState = this.getCell(r, c);
    if (prevState === null || prevState === newState) {
      return { success: false, state: prevState };
    }

    this.board[r][c] = newState;
    this.moveCount++;
    this.history.push({ r, c, prevState, newState, moveNumber: this.moveCount });

    return {
      success: true,
      r,
      c,
      prevState,
      newState,
      isComplete: this.isLevelComplete()
    };
  }

  undo() {
    if (this.history.length === 0) return null;
    const lastMove = this.history.pop();
    this.board[lastMove.r][lastMove.c] = lastMove.prevState;
    return lastMove;
  }

  reset() {
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(CELL_STATE.EMPTY));
    this.history = [];
    this.moveCount = 0;
  }

  getRowStars(r) {
    let count = 0;
    for (let c = 0; c < this.size; c++) {
      if (this.board[r][c] === CELL_STATE.STAR) count++;
    }
    return count;
  }

  getColStars(c) {
    let count = 0;
    for (let r = 0; r < this.size; r++) {
      if (this.board[r][c] === CELL_STATE.STAR) count++;
    }
    return count;
  }

  getZoneStars(z) {
    let count = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.zones[r][c] === z && this.board[r][c] === CELL_STATE.STAR) {
          count++;
        }
      }
    }
    return count;
  }

  getTotalStars() {
    let count = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === CELL_STATE.STAR) count++;
      }
    }
    return count;
  }

  getAdjacencyConflicts() {
    const conflicts = new Set();
    const dirs = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === CELL_STATE.STAR) {
          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
              if (this.board[nr][nc] === CELL_STATE.STAR) {
                conflicts.add(`${r},${c}`);
                conflicts.add(`${nr},${nc}`);
              }
            }
          }
        }
      }
    }
    return conflicts;
  }

  getAllConflicts() {
    const adjacent = this.getAdjacencyConflicts();
    const rowConflicts = new Set();
    const colConflicts = new Set();
    const zoneConflicts = new Set();

    for (let r = 0; r < this.size; r++) {
      if (this.getRowStars(r) > this.starsPerUnit) rowConflicts.add(r);
    }
    for (let c = 0; c < this.size; c++) {
      if (this.getColStars(c) > this.starsPerUnit) colConflicts.add(c);
    }
    for (let z = 0; z < this.zoneCount; z++) {
      if (this.getZoneStars(z) > this.starsPerUnit) zoneConflicts.add(z);
    }

    const starCellConflicts = new Set(adjacent);
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === CELL_STATE.STAR) {
          const z = this.zones[r][c];
          if (rowConflicts.has(r) || colConflicts.has(c) || zoneConflicts.has(z)) {
            starCellConflicts.add(`${r},${c}`);
          }
        }
      }
    }

    return {
      adjacent,
      rowConflicts,
      colConflicts,
      zoneConflicts,
      starCellConflicts
    };
  }

  isLevelComplete() {
    const K = this.starsPerUnit;
    const conflicts = this.getAllConflicts();
    if (conflicts.starCellConflicts.size > 0) return false;

    // Check rows
    for (let r = 0; r < this.size; r++) {
      if (this.getRowStars(r) !== K) return false;
    }
    // Check cols
    for (let c = 0; c < this.size; c++) {
      if (this.getColStars(c) !== K) return false;
    }
    // Check zones
    for (let z = 0; z < this.zoneCount; z++) {
      if (this.getZoneStars(z) !== K) return false;
    }

    return this.getTotalStars() === this.targetStars;
  }

  autoMarkSurroundingDots(r, c) {
    if (this.board[r][c] !== CELL_STATE.STAR) return [];
    const changes = [];
    const dirs = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
        if (this.board[nr][nc] === CELL_STATE.EMPTY) {
          this.setCellState(nr, nc, CELL_STATE.DOT);
          changes.push({ r: nr, c: nc });
        }
      }
    }
    return changes;
  }

  getHint() {
    // 1. Check for conflicts first
    const conflicts = this.getAllConflicts();
    if (conflicts.adjacent.size > 0) {
      const firstCoord = Array.from(conflicts.adjacent)[0].split(',').map(Number);
      return {
        type: 'conflict',
        r: firstCoord[0],
        c: firstCoord[1],
        message: 'Two stars are touching diagonally or orthogonally. Remove one star.'
      };
    }

    if (conflicts.rowConflicts.size > 0) {
      const r = Array.from(conflicts.rowConflicts)[0];
      return {
        type: 'conflict',
        r,
        message: `Row ${r + 1} has more than ${this.starsPerUnit} star(s).`
      };
    }

    if (conflicts.colConflicts.size > 0) {
      const c = Array.from(conflicts.colConflicts)[0];
      return {
        type: 'conflict',
        c,
        message: `Column ${c + 1} has more than ${this.starsPerUnit} star(s).`
      };
    }

    if (conflicts.zoneConflicts.size > 0) {
      const z = Array.from(conflicts.zoneConflicts)[0];
      return {
        type: 'conflict',
        z,
        message: `Constellation Zone #${z + 1} has more than ${this.starsPerUnit} star(s).`
      };
    }

    // 2. Direct single-unit deductions:
    // A) If a row/col/zone is already satisfied, any remaining empty cells can be dotted
    for (let r = 0; r < this.size; r++) {
      if (this.getRowStars(r) === this.starsPerUnit) {
        for (let c = 0; c < this.size; c++) {
          if (this.board[r][c] === CELL_STATE.EMPTY) {
            return {
              type: 'deduction_dot',
              r,
              c,
              targetState: CELL_STATE.DOT,
              message: `Row ${r + 1} has reached its star quota. Cell (${r + 1}, ${c + 1}) can be ruled out.`
            };
          }
        }
      }
    }

    for (let c = 0; c < this.size; c++) {
      if (this.getColStars(c) === this.starsPerUnit) {
        for (let r = 0; r < this.size; r++) {
          if (this.board[r][c] === CELL_STATE.EMPTY) {
            return {
              type: 'deduction_dot',
              r,
              c,
              targetState: CELL_STATE.DOT,
              message: `Column ${c + 1} has reached its star quota. Cell (${r + 1}, ${c + 1}) can be ruled out.`
            };
          }
        }
      }
    }

    for (let z = 0; z < this.zoneCount; z++) {
      if (this.getZoneStars(z) === this.starsPerUnit) {
        for (let r = 0; r < this.size; r++) {
          for (let c = 0; c < this.size; c++) {
            if (this.zones[r][c] === z && this.board[r][c] === CELL_STATE.EMPTY) {
              return {
                type: 'deduction_dot',
                r,
                c,
                targetState: CELL_STATE.DOT,
                message: `Constellation Zone #${z + 1} has all required stars. Cell (${r + 1}, ${c + 1}) can be ruled out.`
              };
            }
          }
        }
      }
    }

    // B) If remaining empty cells + current stars in row/col/zone == starsPerUnit, all empty cells MUST be stars!
    for (let r = 0; r < this.size; r++) {
      const current = this.getRowStars(r);
      const remainingNeeded = this.starsPerUnit - current;
      if (remainingNeeded > 0) {
        const available = [];
        for (let c = 0; c < this.size; c++) {
          if (this.board[r][c] === CELL_STATE.EMPTY) {
            available.push(c);
          }
        }
        if (available.length === remainingNeeded) {
          const c = available[0];
          return {
            type: 'deduction_star',
            r,
            c,
            targetState: CELL_STATE.STAR,
            message: `Row ${r + 1} needs ${remainingNeeded} star(s) and has exactly ${available.length} space(s) remaining.`
          };
        }
      }
    }

    for (let c = 0; c < this.size; c++) {
      const current = this.getColStars(c);
      const remainingNeeded = this.starsPerUnit - current;
      if (remainingNeeded > 0) {
        const available = [];
        for (let r = 0; r < this.size; r++) {
          if (this.board[r][c] === CELL_STATE.EMPTY) {
            available.push(r);
          }
        }
        if (available.length === remainingNeeded) {
          const r = available[0];
          return {
            type: 'deduction_star',
            r,
            c,
            targetState: CELL_STATE.STAR,
            message: `Column ${c + 1} needs ${remainingNeeded} star(s) and has exactly ${available.length} space(s) remaining.`
          };
        }
      }
    }

    for (let z = 0; z < this.zoneCount; z++) {
      const current = this.getZoneStars(z);
      const remainingNeeded = this.starsPerUnit - current;
      if (remainingNeeded > 0) {
        const available = [];
        for (let r = 0; r < this.size; r++) {
          for (let c = 0; c < this.size; c++) {
            if (this.zones[r][c] === z && this.board[r][c] === CELL_STATE.EMPTY) {
              available.push({ r, c });
            }
          }
        }
        if (available.length === remainingNeeded) {
          const cell = available[0];
          return {
            type: 'deduction_star',
            r: cell.r,
            c: cell.c,
            targetState: CELL_STATE.STAR,
            message: `Constellation Zone #${z + 1} needs ${remainingNeeded} star(s) and has exactly ${available.length} space(s) remaining.`
          };
        }
      }
    }

    // 3. Fallback to full backtracking solver solution
    const solution = StarSolver.solve(this);
    if (solution && solution.length > 0) {
      const starMap = new Set(solution[0].map(s => `${s.r},${s.c}`));

      // Check if player has placed a wrong star
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.board[r][c] === CELL_STATE.STAR && !starMap.has(`${r},${c}`)) {
            return {
              type: 'correction',
              r,
              c,
              targetState: CELL_STATE.DOT,
              message: `The star at (${r + 1}, ${c + 1}) cannot lead to a valid constellation.`
            };
          }
        }
      }

      // Recommend next star from solution
      for (const star of solution[0]) {
        if (this.board[star.r][star.c] !== CELL_STATE.STAR) {
          return {
            type: 'solution_star',
            r: star.r,
            c: star.c,
            targetState: CELL_STATE.STAR,
            message: `A celestial star radiates brightly at coordinates (${star.r + 1}, ${star.c + 1}).`
          };
        }
      }
    }

    return {
      type: 'neutral',
      message: 'Take a calm breath and examine the neighboring constellation bounds.'
    };
  }
}

/**
 * Star Battle Backtracking & Constraint Propagation Solver
 */
class StarSolver {
  static solve(levelOrEngine, maxSolutions = 1) {
    const size = levelOrEngine.size;
    const K = levelOrEngine.starsPerUnit || 1;
    const zones = levelOrEngine.zones;
    const zoneCount = levelOrEngine.zoneCount || size;

    // Board representation: 0 = available, 1 = star placed, 2 = forbidden/eliminated
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    const rowStars = Array(size).fill(0);
    const colStars = Array(size).fill(0);
    const zoneStars = Array(zoneCount).fill(0);

    const solutions = [];
    const currentStars = [];

    // Helper: test if cell (r, c) can receive a star
    function canPlaceStar(r, c) {
      if (grid[r][c] !== 0) return false;
      if (rowStars[r] >= K) return false;
      if (colStars[c] >= K) return false;
      const z = zones[r][c];
      if (zoneStars[z] >= K) return false;

      // Adjacency check
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (grid[nr][nc] === 1) return false;
          }
        }
      }
      return true;
    }

    // Constraint propagation forward check:
    // Check if each row, col, and zone still has enough available cells to meet quota K
    function isPruned() {
      // Row check
      for (let r = 0; r < size; r++) {
        const remainingNeeded = K - rowStars[r];
        if (remainingNeeded < 0) return true;
        let available = 0;
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === 0) available++;
        }
        if (available < remainingNeeded) return true;
      }

      // Col check
      for (let c = 0; c < size; c++) {
        const remainingNeeded = K - colStars[c];
        if (remainingNeeded < 0) return true;
        let available = 0;
        for (let r = 0; r < size; r++) {
          if (grid[r][c] === 0) available++;
        }
        if (available < remainingNeeded) return true;
      }

      // Zone check
      for (let z = 0; z < zoneCount; z++) {
        const remainingNeeded = K - zoneStars[z];
        if (remainingNeeded < 0) return true;
        let available = 0;
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (zones[r][c] === z && grid[r][c] === 0) available++;
          }
        }
        if (available < remainingNeeded) return true;
      }

      return false;
    }

    function search(rowIndex) {
      if (solutions.length >= maxSolutions) return;

      if (rowIndex === size) {
        // Verify all columns and zones met
        for (let c = 0; c < size; c++) {
          if (colStars[c] !== K) return;
        }
        for (let z = 0; z < zoneCount; z++) {
          if (zoneStars[z] !== K) return;
        }
        solutions.push([...currentStars]);
        return;
      }

      const neededInRow = K - rowStars[rowIndex];

      if (neededInRow === 0) {
        // Proceed to next row
        search(rowIndex + 1);
        return;
      }

      // Find all available valid columns in this row
      const validCols = [];
      for (let c = 0; c < size; c++) {
        if (canPlaceStar(rowIndex, c)) {
          validCols.push(c);
        }
      }

      if (validCols.length < neededInRow) return;

      // Recursive combinations of columns for this row
      function chooseCols(startIdx, countLeft, chosenCols) {
        if (countLeft === 0) {
          // Apply placements
          const undoList = [];
          for (const c of chosenCols) {
            grid[rowIndex][c] = 1; // star
            rowStars[rowIndex]++;
            colStars[c]++;
            const z = zones[rowIndex][c];
            zoneStars[z]++;
            currentStars.push({ r: rowIndex, c });
            undoList.push({ r: rowIndex, c, z });

            // Mark neighbors as forbidden
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = rowIndex + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                  if (grid[nr][nc] === 0) {
                    grid[nr][nc] = 2; // forbidden
                    undoList.push({ r: nr, c: nc, neighborForbidden: true });
                  }
                }
              }
            }
          }

          if (!isPruned()) {
            search(rowIndex + 1);
          }

          // Undo placements
          for (let i = undoList.length - 1; i >= 0; i--) {
            const entry = undoList[i];
            if (entry.neighborForbidden) {
              grid[entry.r][entry.c] = 0;
            } else {
              grid[entry.r][entry.c] = 0;
              rowStars[entry.r]--;
              colStars[entry.c]--;
              zoneStars[entry.z]--;
              currentStars.pop();
            }
          }
          return;
        }

        for (let i = startIdx; i <= validCols.length - countLeft; i++) {
          const col = validCols[i];
          // Check horizontal adjacency with previously chosen columns in this row
          let conflict = false;
          for (const prevCol of chosenCols) {
            if (Math.abs(prevCol - col) <= 1) {
              conflict = true;
              break;
            }
          }
          if (conflict) continue;

          chosenCols.push(col);
          chooseCols(i + 1, countLeft - 1, chosenCols);
          chosenCols.pop();
        }
      }

      chooseCols(0, neededInRow, []);
    }

    search(0);
    return solutions;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CELL_STATE, StarEngine, StarSolver };
}
