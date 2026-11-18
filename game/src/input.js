// Keyboard and mouse input. Held keys become a per-frame input object; one-shot
// presses (enter car, pause, save, punch) are queued as flags and taken once, so a
// press between two frames is never lost and never counted twice.

export const ACTION_ENTER = 1;
export const ACTION_PAUSE = 2;
export const ACTION_CONFIRM = 4;
export const ACTION_SAVE = 8;
export const ACTION_MELEE = 16;
export const ACTION_NEWGAME = 32;
export const ACTION_QUIT = 64;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const RUN = new Set(['ShiftLeft', 'ShiftRight']);
const ENTER = new Set(['KeyE']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const SAVE = new Set(['KeyQ']);
const MELEE = new Set(['KeyF']);
const NEWGAME = new Set(['KeyN']);
const QUIT = new Set(['KeyR']);

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let mouseX = 0;
  let mouseY = 0;
  let mouseDown = false;
  let mouseClicked = false;

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    if (ENTER.has(event.code)) actions |= ACTION_ENTER;
    else if (PAUSE.has(event.code)) actions |= ACTION_PAUSE;
    else if (CONFIRM.has(event.code)) actions |= ACTION_CONFIRM;
    else if (SAVE.has(event.code)) actions |= ACTION_SAVE;
    else if (MELEE.has(event.code)) actions |= ACTION_MELEE;
    else if (NEWGAME.has(event.code)) actions |= ACTION_NEWGAME;
    else if (QUIT.has(event.code)) actions |= ACTION_QUIT;
    if (UP.has(event.code) || DOWN.has(event.code) || LEFT.has(event.code) || RIGHT.has(event.code) || CONFIRM.has(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
    mouseDown = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    mouseDown = true;
    mouseClicked = true;
    actions |= ACTION_CONFIRM;
  });
  window.addEventListener('pointerup', () => {
    mouseDown = false;
  });

  function held(set) {
    for (const code of set) if (keys.has(code)) return true;
    return false;
  }

  return {
    /** The frame's driving / walking input, plus the mouse position on the canvas. */
    frame() {
      return {
        up: held(UP),
        down: held(DOWN),
        left: held(LEFT),
        right: held(RIGHT),
        run: held(RUN),
        mouseX,
        mouseY,
        mouseDown,
        mouseClicked,
      };
    },
    takeMouseClick() {
      const clicked = mouseClicked;
      mouseClicked = false;
      return clicked;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
