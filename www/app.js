/**
 * ZenStars - Frontend Application Controller
 * Manages game state, responsive rendering, drag-painting, audio, and storage.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global references
  const audio = new StarAudio();
  let currentLevelIndex = 0;
  let engine = null;
  let currentLevelData = null;

  let activeMode = 'cycle'; // 'cycle' | 'star' | 'dot'
  let isPointerDown = false;
  let dragPaintedCells = new Set();
  let dragTargetState = null;

  let startTime = null;
  let timerInterval = null;
  let completedLevels = new Set();

  // Load persistence
  try {
    const savedLevel = localStorage.getItem('zenstars_current_level');
    if (savedLevel !== null) {
      const idx = parseInt(savedLevel, 10);
      if (!isNaN(idx) && idx >= 0 && idx < ZEN_STARS_LEVELS.length) {
        currentLevelIndex = idx;
      }
    }

    const savedCompleted = localStorage.getItem('zenstars_completed');
    if (savedCompleted) {
      completedLevels = new Set(JSON.parse(savedCompleted));
    }
  } catch (e) {
    console.warn('Storage read failed:', e);
  }

  // DOM Elements
  const boardEl = document.getElementById('board');
  const levelTitleEl = document.getElementById('level-title');
  const packBadgeBtn = document.getElementById('pack-badge-btn');
  const starsPlacedEl = document.getElementById('stars-placed');
  const starsTotalEl = document.getElementById('stars-total');
  const starsQuotaEl = document.getElementById('stars-quota');
  const starsProgressEl = document.getElementById('stars-progress');
  const starsProgressFillEl = document.getElementById('stars-progress-fill');
  const boardSizeEl = document.getElementById('board-size');

  const btnSound = document.getElementById('btn-sound');
  const btnRules = document.getElementById('btn-rules');
  const btnLevels = document.getElementById('btn-levels');
  const btnUndo = document.getElementById('btn-undo');
  const btnHint = document.getElementById('btn-hint');
  const btnReset = document.getElementById('btn-reset');

  const modeCycleBtn = document.getElementById('mode-cycle');
  const modeStarBtn = document.getElementById('mode-star');
  const modeDotBtn = document.getElementById('mode-dot');
  const modeHelpEl = document.getElementById('mode-help');

  const toastEl = document.getElementById('toast');
  const modalVictory = document.getElementById('modal-victory');
  const modalLevels = document.getElementById('modal-levels');
  const modalRules = document.getElementById('modal-rules');

  const btnNextLevel = document.getElementById('btn-next-level');
  const btnCloseLevels = document.getElementById('btn-close-levels');
  const btnCloseRules = document.getElementById('btn-close-rules');
  const btnCloseRulesBtn = document.getElementById('btn-close-rules-btn');

  const packTabsEl = document.getElementById('pack-tabs');
  const levelGridEl = document.getElementById('level-grid');
  const statMovesEl = document.getElementById('stat-moves');
  const statTimeEl = document.getElementById('stat-time');

  // Initialize Sound button UI
  function updateSoundUI() {
    const on = audio.isSoundEnabled();
    btnSound.classList.toggle('is-muted', !on);
    btnSound.setAttribute('aria-pressed', String(on));
    btnSound.setAttribute('aria-label', on ? 'Mute sound' : 'Turn sound on');
    btnSound.title = on ? 'Sound on' : 'Sound off';
  }
  updateSoundUI();

  // Toast notification helper
  let toastTimeout = null;
  function showToast(message, duration = 3000) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, duration);
  }

  // Timer helpers
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(() => {
      // timer running
    }, 1000);
  }

  function getFormattedElapsed() {
    if (!startTime) return '0:00';
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Load a Level
  function loadLevel(index) {
    if (index < 0 || index >= ZEN_STARS_LEVELS.length) index = 0;
    currentLevelIndex = index;
    currentLevelData = ZEN_STARS_LEVELS[currentLevelIndex];
    engine = new StarEngine(currentLevelData);

    try {
      localStorage.setItem('zenstars_current_level', String(currentLevelIndex));
    } catch (e) {}

    // Update Header
    levelTitleEl.textContent = `Level ${currentLevelData.id}: ${currentLevelData.name}`;
    packBadgeBtn.querySelector('span').textContent = currentLevelData.packName;
    starsQuotaEl.textContent = `${currentLevelData.starsPerUnit} Star${currentLevelData.starsPerUnit > 1 ? 's' : ''}`;
    starsTotalEl.textContent = String(engine.targetStars);
    boardSizeEl.textContent = `${engine.size} × ${engine.size}`;
    starsProgressEl.setAttribute('aria-valuemax', String(engine.targetStars));

    startTimer();
    renderBoard();
    updateStatus();

    // Close any open modals
    modalVictory.classList.remove('open');
    modalLevels.classList.remove('open');
  }

  // Render the responsive board
  function renderBoard() {
    boardEl.innerHTML = '';
    const size = engine.size;

    // Leave room for the responsive panel gutters so the grid stays square.
    const compactLayout = window.innerWidth <= 900;
    const viewportW = Math.min(window.innerWidth - (compactLayout ? 56 : 36), 560);
    const viewportH = Math.min(window.innerHeight - 240, 560);
    const boardDimension = Math.max(220, Math.floor(Math.min(viewportW, viewportH)));

    boardEl.style.width = `${boardDimension}px`;
    boardEl.style.height = `${boardDimension}px`;
    boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'star-cell';
        cellEl.dataset.r = r;
        cellEl.dataset.c = c;
        cellEl.setAttribute('role', 'gridcell');
        cellEl.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}`);

        // Constellation Zone class
        const zoneId = engine.getZone(r, c);
        cellEl.classList.add(`zone-${zoneId % 9}`);

        // Border accents between distinct zones
        if (r === 0 || engine.getZone(r - 1, c) !== zoneId) cellEl.classList.add('border-t-zone');
        if (r === size - 1 || engine.getZone(r + 1, c) !== zoneId) cellEl.classList.add('border-b-zone');
        if (c === 0 || engine.getZone(r, c - 1) !== zoneId) cellEl.classList.add('border-l-zone');
        if (c === size - 1 || engine.getZone(r, c + 1) !== zoneId) cellEl.classList.add('border-r-zone');

        updateCellElement(cellEl, engine.getCell(r, c));
        boardEl.appendChild(cellEl);
      }
    }
  }

  // Update cell visual state
  function updateCellElement(cellEl, state, hasConflict = false) {
    cellEl.innerHTML = '';
    cellEl.classList.remove('conflict');

    if (state === CELL_STATE.STAR) {
      const star = document.createElement('span');
      star.className = 'glyph-star';
      star.textContent = '✦';
      cellEl.appendChild(star);
      if (hasConflict) {
        cellEl.classList.add('conflict');
      }
    } else if (state === CELL_STATE.DOT) {
      const dot = document.createElement('span');
      dot.className = 'glyph-dot';
      cellEl.appendChild(dot);
    }
  }

  // Update status bar & check completion
  function updateStatus() {
    const totalPlaced = engine.getTotalStars();
    starsPlacedEl.textContent = String(totalPlaced);
    const progress = Math.min(100, (totalPlaced / engine.targetStars) * 100);
    starsProgressFillEl.style.width = `${progress}%`;
    starsProgressEl.setAttribute('aria-valuenow', String(totalPlaced));
    btnUndo.disabled = engine.history.length === 0;

    if (totalPlaced === engine.targetStars) {
      starsPlacedEl.className = 'quota-satisfied';
    } else if (totalPlaced > engine.targetStars) {
      starsPlacedEl.className = 'quota-over';
    } else {
      starsPlacedEl.className = '';
    }

    // Refresh conflict highlights
    const conflicts = engine.getAllConflicts();
    const cells = boardEl.querySelectorAll('.star-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);
      const state = engine.getCell(r, c);
      const isConflicting = conflicts.starCellConflicts.has(`${r},${c}`);
      updateCellElement(cell, state, isConflicting);
    });

    // Check Victory
    if (engine.isLevelComplete()) {
      handleVictory();
    }
  }

  // Handle Level Victory
  function handleVictory() {
    if (timerInterval) clearInterval(timerInterval);
    audio.playVictory();

    completedLevels.add(currentLevelData.id);
    try {
      localStorage.setItem('zenstars_completed', JSON.stringify(Array.from(completedLevels)));
    } catch (e) {}

    statMovesEl.textContent = String(engine.moveCount);
    statTimeEl.textContent = getFormattedElapsed();

    setTimeout(() => {
      modalVictory.classList.add('open');
    }, 400);
  }

  // Cell Interaction Handler
  function handleCellAction(r, c, isDrag = false) {
    const currentState = engine.getCell(r, c);
    let targetState;

    if (activeMode === 'cycle') {
      if (isDrag) {
        // When dragging across cells in cycle mode, paint dots
        targetState = dragTargetState !== null ? dragTargetState : (currentState === CELL_STATE.DOT ? CELL_STATE.EMPTY : CELL_STATE.DOT);
      } else {
        if (currentState === CELL_STATE.EMPTY) targetState = CELL_STATE.DOT;
        else if (currentState === CELL_STATE.DOT) targetState = CELL_STATE.STAR;
        else targetState = CELL_STATE.EMPTY;
      }
    } else if (activeMode === 'star') {
      targetState = currentState === CELL_STATE.STAR ? CELL_STATE.EMPTY : CELL_STATE.STAR;
    } else if (activeMode === 'dot') {
      targetState = currentState === CELL_STATE.DOT ? CELL_STATE.EMPTY : CELL_STATE.DOT;
    }

    if (targetState !== currentState) {
      const res = engine.setCellState(r, c, targetState);
      if (res.success) {
        if (targetState === CELL_STATE.STAR) {
          audio.playStarChime(r + c);
          // Optional: Auto-mark surrounding 8 cells with dots for player convenience
          engine.autoMarkSurroundingDots(r, c);
        } else if (targetState === CELL_STATE.DOT) {
          audio.playDotTap();
        } else {
          audio.playErase();
        }
        updateStatus();
      }
    }
  }

  // Pointer & Drag Interactions for Board
  boardEl.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.star-cell');
    if (!cell) return;

    isPointerDown = true;
    dragPaintedCells.clear();
    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);
    dragPaintedCells.add(`${r},${c}`);

    const curr = engine.getCell(r, c);
    if (activeMode === 'cycle') {
      // If tapping directly, let cycle take place; if dragging begins, it uses dot paint
      dragTargetState = curr === CELL_STATE.DOT ? CELL_STATE.EMPTY : CELL_STATE.DOT;
      handleCellAction(r, c, false);
    } else {
      dragTargetState = activeMode === 'star' ? CELL_STATE.STAR : CELL_STATE.DOT;
      handleCellAction(r, c, false);
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target) return;
    const cell = target.closest('.star-cell');
    if (!cell) return;

    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);
    const key = `${r},${c}`;

    if (!dragPaintedCells.has(key)) {
      dragPaintedCells.add(key);
      handleCellAction(r, c, true);
    }
  });

  window.addEventListener('pointerup', () => {
    isPointerDown = false;
    dragPaintedCells.clear();
    dragTargetState = null;
  });

  window.addEventListener('pointercancel', () => {
    isPointerDown = false;
    dragPaintedCells.clear();
    dragTargetState = null;
  });

  // Mode Selection Pills
  function setMode(mode) {
    activeMode = mode;
    audio.playButtonTap();
    modeCycleBtn.classList.toggle('active', mode === 'cycle');
    modeStarBtn.classList.toggle('active', mode === 'star');
    modeDotBtn.classList.toggle('active', mode === 'dot');

    modeCycleBtn.setAttribute('aria-checked', mode === 'cycle');
    modeStarBtn.setAttribute('aria-checked', mode === 'star');
    modeDotBtn.setAttribute('aria-checked', mode === 'dot');
    modeHelpEl.textContent = {
      cycle: 'Tap a cell to cycle through empty, ruled out, and star.',
      star: 'Tap a cell to place a star or remove one already there.',
      dot: 'Tap cells to mark spots you have ruled out.'
    }[mode];
  }

  modeCycleBtn.addEventListener('click', () => setMode('cycle'));
  modeStarBtn.addEventListener('click', () => setMode('star'));
  modeDotBtn.addEventListener('click', () => setMode('dot'));

  // Action Buttons
  btnUndo.addEventListener('click', () => {
    audio.playButtonTap();
    const lastMove = engine.undo();
    if (lastMove) {
      updateStatus();
    } else {
      showToast('Nothing to undo.');
    }
  });

  btnReset.addEventListener('click', () => {
    audio.playButtonTap();
    engine.reset();
    updateStatus();
    showToast('Board cleared.');
  });

  btnHint.addEventListener('click', () => {
    audio.playButtonTap();
    // Clear existing highlight
    document.querySelectorAll('.hint-highlight').forEach(el => el.classList.remove('hint-highlight'));

    const hint = engine.getHint();
    if (hint) {
      showToast(hint.message, 3500);

      if (hint.r !== undefined && hint.c !== undefined) {
        const cell = boardEl.querySelector(`[data-r="${hint.r}"][data-c="${hint.c}"]`);
        if (cell) {
          cell.classList.add('hint-highlight');
          setTimeout(() => cell.classList.remove('hint-highlight'), 3000);
        }
      }
    }
  });

  // Sound Toggle
  btnSound.addEventListener('click', () => {
    const on = audio.toggleSound();
    updateSoundUI();
    if (on) audio.playButtonTap();
  });

  // Rules Modal
  btnRules.addEventListener('click', () => {
    audio.playButtonTap();
    modalRules.classList.add('open');
  });
  btnCloseRules.addEventListener('click', () => modalRules.classList.remove('open'));
  btnCloseRulesBtn.addEventListener('click', () => modalRules.classList.remove('open'));

  // Next Level
  btnNextLevel.addEventListener('click', () => {
    audio.playButtonTap();
    loadLevel((currentLevelIndex + 1) % ZEN_STARS_LEVELS.length);
  });

  // Level Select Modal
  function populateLevelSelectModal() {
    packTabsEl.innerHTML = '';
    const packs = [
      { id: 1, name: 'Dawn Novas' },
      { id: 2, name: 'Astral Runes' },
      { id: 3, name: 'Sacred Nebula' },
      { id: 4, name: 'Celestial' },
      { id: 5, name: 'Galaxies' }
    ];

    let activePackId = currentLevelData.pack;

    function renderPackLevels(packId) {
      activePackId = packId;
      // Update tab active state
      packTabsEl.querySelectorAll('.pack-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.pack, 10) === packId);
      });

      levelGridEl.innerHTML = '';
      const packLevels = ZEN_STARS_LEVELS.filter(l => l.pack === packId);

      packLevels.forEach(lvl => {
        const chip = document.createElement('div');
        chip.className = 'level-chip';
        if (lvl.id === currentLevelData.id) chip.classList.add('active');
        if (completedLevels.has(lvl.id)) chip.classList.add('completed');

        const num = document.createElement('span');
        num.className = 'level-chip-num';
        num.textContent = lvl.id;
        chip.appendChild(num);

        chip.addEventListener('click', () => {
          audio.playButtonTap();
          const targetIndex = ZEN_STARS_LEVELS.findIndex(l => l.id === lvl.id);
          if (targetIndex !== -1) {
            loadLevel(targetIndex);
          }
        });

        levelGridEl.appendChild(chip);
      });
    }

    packs.forEach(p => {
      const tab = document.createElement('button');
      tab.className = 'pack-tab';
      tab.dataset.pack = p.id;
      tab.textContent = p.name;
      tab.addEventListener('click', () => {
        audio.playButtonTap();
        renderPackLevels(p.id);
      });
      packTabsEl.appendChild(tab);
    });

    renderPackLevels(activePackId);
  }

  btnLevels.addEventListener('click', () => {
    audio.playButtonTap();
    populateLevelSelectModal();
    modalLevels.classList.add('open');
  });

  packBadgeBtn.addEventListener('click', () => {
    audio.playButtonTap();
    populateLevelSelectModal();
    modalLevels.classList.add('open');
  });

  btnCloseLevels.addEventListener('click', () => modalLevels.classList.remove('open'));

  // Close modals on overlay backdrop click
  [modalVictory, modalLevels, modalRules].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Keyboard Shortcuts (Accessibility & Speed)
  window.addEventListener('keydown', (e) => {
    if (modalVictory.classList.contains('open') || modalLevels.classList.contains('open') || modalRules.classList.contains('open')) {
      if (e.key === 'Escape') {
        modalVictory.classList.remove('open');
        modalLevels.classList.remove('open');
        modalRules.classList.remove('open');
      }
      return;
    }

    if (e.key === 'z' || (e.ctrlKey && e.key === 'z')) {
      btnUndo.click();
    } else if (e.key === 'h' || e.key === '?') {
      btnHint.click();
    } else if (e.key === 'r') {
      btnReset.click();
    } else if (e.key === '1') {
      setMode('cycle');
    } else if (e.key === '2') {
      setMode('star');
    } else if (e.key === '3') {
      setMode('dot');
    } else if (e.key === 'm') {
      btnSound.click();
    }
  });

  // Responsive resize
  window.addEventListener('resize', () => {
    renderBoard();
    updateStatus();
  });

  // Register Service Worker for 100% Offline PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('SW registration skipped:', err);
      });
    });
  }

  // Initial Load
  loadLevel(currentLevelIndex);
});
