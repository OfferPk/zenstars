const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { CELL_STATE, StarEngine, StarSolver } = require('../src/star-engine.js');
const { ZEN_STARS_LEVELS } = require('../src/levels.js');

describe('ZenStars Core Engine Logic', () => {
  test('Initializes level correctly', () => {
    const level1 = ZEN_STARS_LEVELS[0];
    const engine = new StarEngine(level1);

    assert.equal(engine.id, 1);
    assert.equal(engine.size, 5);
    assert.equal(engine.starsPerUnit, 1);
    assert.equal(engine.targetStars, 5);
    assert.equal(engine.getTotalStars(), 0);
    assert.equal(engine.isLevelComplete(), false);
  });

  test('Cycles cell states: EMPTY (0) -> DOT (1) -> STAR (2) -> EMPTY (0)', () => {
    const level1 = ZEN_STARS_LEVELS[0];
    const engine = new StarEngine(level1);

    assert.equal(engine.getCell(0, 0), CELL_STATE.EMPTY);

    // 0 -> 1 (DOT)
    const step1 = engine.cycleCell(0, 0);
    assert.equal(step1.success, true);
    assert.equal(engine.getCell(0, 0), CELL_STATE.DOT);

    // 1 -> 2 (STAR)
    const step2 = engine.cycleCell(0, 0);
    assert.equal(step2.success, true);
    assert.equal(engine.getCell(0, 0), CELL_STATE.STAR);
    assert.equal(engine.getTotalStars(), 1);

    // 2 -> 0 (EMPTY)
    const step3 = engine.cycleCell(0, 0);
    assert.equal(step3.success, true);
    assert.equal(engine.getCell(0, 0), CELL_STATE.EMPTY);
    assert.equal(engine.getTotalStars(), 0);
  });

  test('Undo and reset operations work properly', () => {
    const level1 = ZEN_STARS_LEVELS[0];
    const engine = new StarEngine(level1);

    engine.setCellState(1, 1, CELL_STATE.STAR);
    engine.setCellState(2, 2, CELL_STATE.DOT);
    assert.equal(engine.getCell(1, 1), CELL_STATE.STAR);
    assert.equal(engine.getCell(2, 2), CELL_STATE.DOT);

    engine.undo();
    assert.equal(engine.getCell(2, 2), CELL_STATE.EMPTY);
    assert.equal(engine.getCell(1, 1), CELL_STATE.STAR);

    engine.undo();
    assert.equal(engine.getCell(1, 1), CELL_STATE.EMPTY);

    // Reset test
    engine.setCellState(0, 0, CELL_STATE.STAR);
    engine.setCellState(3, 3, CELL_STATE.DOT);
    engine.reset();
    assert.equal(engine.getCell(0, 0), CELL_STATE.EMPTY);
    assert.equal(engine.getCell(3, 3), CELL_STATE.EMPTY);
    assert.equal(engine.history.length, 0);
  });

  test('Detects diagonal, horizontal, and vertical adjacency conflicts', () => {
    const testLevel = {
      id: 999,
      size: 5,
      starsPerUnit: 1,
      zones: [
        [0, 0, 1, 1, 1],
        [0, 0, 1, 1, 1],
        [2, 2, 3, 3, 3],
        [2, 2, 3, 3, 3],
        [4, 4, 4, 4, 4]
      ]
    };
    const engine = new StarEngine(testLevel);

    // Place diagonal adjacent stars at (1, 1) and (2, 2)
    engine.setCellState(1, 1, CELL_STATE.STAR);
    engine.setCellState(2, 2, CELL_STATE.STAR);

    const conflicts = engine.getAdjacencyConflicts();
    assert.ok(conflicts.has('1,1'));
    assert.ok(conflicts.has('2,2'));
    assert.equal(engine.isLevelComplete(), false);
  });

  test('Detects row, column, and zone over-quota conflicts', () => {
    const testLevel = {
      id: 998,
      size: 5,
      starsPerUnit: 1,
      zones: [
        [0, 0, 1, 1, 1],
        [0, 0, 1, 1, 1],
        [2, 2, 3, 3, 3],
        [2, 2, 3, 3, 3],
        [4, 4, 4, 4, 4]
      ]
    };
    const engine = new StarEngine(testLevel);

    // Two stars in row 0 at (0, 0) and (0, 3) (non-adjacent)
    engine.setCellState(0, 0, CELL_STATE.STAR);
    engine.setCellState(0, 3, CELL_STATE.STAR);

    const allConflicts = engine.getAllConflicts();
    assert.ok(allConflicts.rowConflicts.has(0));
    assert.equal(allConflicts.adjacent.size, 0);
    assert.equal(engine.isLevelComplete(), false);
  });

  test('Auto-marks surrounding cells with dots when requested', () => {
    const level1 = ZEN_STARS_LEVELS[0];
    const engine = new StarEngine(level1);

    engine.setCellState(2, 2, CELL_STATE.STAR);
    const changes = engine.autoMarkSurroundingDots(2, 2);

    assert.equal(changes.length, 8); // All 8 neighbors
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        assert.equal(engine.getCell(2 + dr, 2 + dc), CELL_STATE.DOT);
      }
    }
  });

  test('Hint engine provides actionable guidance', () => {
    const level1 = ZEN_STARS_LEVELS[0];
    const engine = new StarEngine(level1);

    const hint = engine.getHint();
    assert.ok(hint);
    assert.ok(hint.message);
    assert.ok(hint.type);
  });

  test('StarSolver verifies and solves all 50 levels to completion', () => {
    assert.equal(ZEN_STARS_LEVELS.length, 50);

    for (let i = 0; i < 50; i++) {
      const level = ZEN_STARS_LEVELS[i];
      const solutions = StarSolver.solve(level, 2);

      assert.equal(solutions.length, 1, `Level ${level.id} (${level.name}) must have exactly 1 unique solution`);

      // Verify the solution in the engine
      const engine = new StarEngine(level);
      for (const star of solutions[0]) {
        engine.setCellState(star.r, star.c, CELL_STATE.STAR);
      }

      assert.equal(engine.isLevelComplete(), true, `Level ${level.id} (${level.name}) must be complete`);
    }
  });
});
