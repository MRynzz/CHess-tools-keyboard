// ===== VERSI LENGKAP DENGAN UNDO/REDO ===== //
// 1. Fungsi Utama yang Sudah Berfungsi
async function movePiece(from, to) {
  try {
    const board = document.querySelector('wc-chess-board.board');
    if (!board) throw new Error("Papan catur tidak ditemukan");

    const simulateClick = (squareNotation, isFrom) => {
      const squareId = `square-${squareNotation[0].charCodeAt(0)-96}${squareNotation[1]}`;
      const squareElement = board.querySelector(`.${squareId}`);
      
      if (!squareElement) {
        console.error(`Elemen untuk ${squareNotation} (${squareId}) tidak ditemukan`);
        return false;
      }

      const rect = squareElement.getBoundingClientRect();
      const centerX = rect.left + rect.width/2;
      const centerY = rect.top + rect.height/2;

      if (isFrom) {
        squareElement.style.boxShadow = '0 0 10px 5px rgba(255, 255, 0, 0.7)';
        setTimeout(() => squareElement.style.boxShadow = '', 500);
      }

      const events = [
        'pointerover', 'mouseover', 'pointerdown', 'mousedown',
        'mouseup', 'pointerup', 'click'
      ];

      events.forEach(type => {
        const event = new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: centerX,
          clientY: centerY,
          buttons: type.includes('down') ? 1 : 0
        });
        squareElement.dispatchEvent(event);
      });

      return true;
    };

    console.log(`Memindahkan ${from} → ${to}...`);
    if (!simulateClick(from, true)) throw new Error(`Gagal memilih bidak di ${from}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!simulateClick(to, false)) throw new Error(`Gagal memindahkan ke ${to}`);

    showFeedback(`✔ ${from} → ${to}`);
    return true;

  } catch (error) {
    console.error("Error:", error.message);
    showFeedback(error.message, true);
    return false;
  }
}

// 2. Sistem Input Keyboard (Tetap Sama)
let moveSteps = {
  phase: 0,
  from: '',
  to: ''
};

// 3. Fungsi Feedback Baru
function showFeedback(message, isError = false) {
  const existing = document.querySelector('.chess-helper-feedback');
  if (existing) existing.remove();

  const feedback = document.createElement('div');
  feedback.className = 'chess-helper-feedback';
  feedback.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${isError ? '#ff4444' : '#4CAF50'};
    color: white;
    border-radius: 5px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
  `;
  feedback.textContent = message;
  
  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 3000);
}

// 4. Fitur Undo/Redo Baru
function undoMove() {
  const prevBtn = document.querySelector('.game-controls-primary-component button:nth-child(2)');
  if (prevBtn && !prevBtn.disabled) {
    prevBtn.click();
    showFeedback("↩ Undo");
  } else {
    showFeedback("Tidak bisa undo", true);
  }
}

function redoMove() {
  const nextBtn = document.querySelector('.game-controls-primary-component button:nth-child(4)');
  if (nextBtn && !nextBtn.disabled) {
    nextBtn.click();
    showFeedback("↪ Redo");
  } else {
    showFeedback("Tidak bisa redo", true);
  }
}

// 5. Handler Input Keyboard (Diperbarui)
function handleChessInput(e) {
  const keyMap = {
    KeyA: 'a', KeyB: 'b', KeyC: 'c', KeyD: 'd',
    KeyE: 'e', KeyF: 'f', KeyG: 'g', KeyH: 'h',
    Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4',
    Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8',
    Escape: 'cancel',
    KeyZ: 'flip',
    KeyU: 'undo',
    KeyY: 'redo',
    KeyR: 'redo'
  };
  
  const key = keyMap[e.code] || e.key.toLowerCase();
  
  // Handle Ctrl+Z/Y
  if ((e.ctrlKey || e.metaKey) && key === 'z') return undoMove();
  if ((e.ctrlKey || e.metaKey) && key === 'y') return redoMove();

  e.preventDefault();
  e.stopPropagation();

  if (key === 'flip') {
    document.querySelector('#board-controls-flip')?.click();
    showFeedback("Papan diputar");
    return;
  }

  if (key === 'undo') {
    undoMove();
    return;
  }

  if (key === 'redo') {
    redoMove();
    return;
  }

  if (key === 'cancel') {
    moveSteps = { phase: 0, from: '', to: '' };
    showFeedback("Input dibatalkan");
    return;
  }

  if (moveSteps.phase === 0 && /^[a-h]$/.test(key)) {
    moveSteps.from = key;
    moveSteps.phase = 1;
    showFeedback(`Pilih baris untuk ${key.toUpperCase()}?`);
  } 
  else if (moveSteps.phase === 1 && /^[1-8]$/.test(key)) {
    moveSteps.from += key;
    moveSteps.phase = 2;
    const squareId = `square-${moveSteps.from[0].charCodeAt(0)-96}${moveSteps.from[1]}`;
    const squareElement = document.querySelector(`.${squareId}`);
    if (squareElement) {
      squareElement.style.boxShadow = '0 0 10px 5px rgba(255, 255, 0, 0.7)';
      setTimeout(() => squareElement.style.boxShadow = '', 1000);
    }
    showFeedback(`Memilih ${moveSteps.from}, pilih kolom tujuan`);
  }
  else if (moveSteps.phase === 2 && /^[a-h]$/.test(key)) {
    moveSteps.to = key;
    moveSteps.phase = 3;
    showFeedback(`Pilih baris untuk ${key.toUpperCase()}?`);
  }
  else if (moveSteps.phase === 3 && /^[1-8]$/.test(key)) {
    moveSteps.to += key;
    showFeedback(`Memindahkan ${moveSteps.from} → ${moveSteps.to}`);
    movePiece(moveSteps.from, moveSteps.to).then(success => {
      if (success) moveSteps = { phase: 0, from: '', to: '' };
    });
  }
}

// 6. Inisialisasi
function initChessKeyboard() {
  document.addEventListener('keydown', handleChessInput, true);
  
  const board = document.querySelector('wc-chess-board');
  if (board) {
    board.tabIndex = -1;
    board.focus();
  }
  
  showFeedback("♟️ Chess Helper Aktif! Gunakan: e2e4 untuk move, U/Y untuk undo/redo");
}

// Auto-init
if (document.readyState === 'complete') initChessKeyboard();
else window.addEventListener('load', initChessKeyboard);
