const helper = document.getElementById('helper');
let horizontalMouseDown = false;
let verticalMouseDown = false
const root = document.documentElement;
const resize = document.getElementById('divider');
const verticalDivider = document.getElementById('verticalDivider')
const verticalHelper = document.getElementById('verticalHelper')
const browser = document.getElementById('browser')

verticalDivider.addEventListener('mousedown', (e) => {
  verticalMouseDown = true;
  verticalHelper.style.left = `${e.clientX}px`;
  verticalHelper.style.top = `${e.clientY}px`;
})

resize.addEventListener('mousedown', (e) => {
  horizontalMouseDown = true;
  helper.style.left = `${e.clientX}px`;
  helper.style.top = `${e.clientY}px`;
});

document.addEventListener('mousemove', (e) => {
  if (horizontalMouseDown) {
    e.preventDefault();
    helper.style.left = `${e.clientX}px`;
    helper.style.top = `${e.clientY}px`;
    const viewportWidth = window.innerWidth;
    root.style.setProperty('--inWidth', `${e.clientX / viewportWidth * 100}%`);
  }
  if (verticalMouseDown) {
    e.preventDefault();
    verticalHelper.style.left = `${e.clientX}px`;
    verticalHelper.style.top = `${e.clientY}px`;
    const viewportHeight = browser.clientHeight;
    root.style.setProperty('--height', `clamp(0px, calc(${e.clientY} / ${viewportHeight} * 100% - 87px), calc(100% - 12px)`);
  }
});

document.addEventListener('mouseup', () => {
  horizontalMouseDown = false;
  verticalMouseDown = false;
  helper.style.left = `-2000px`;
  helper.style.top = `-2000px`;
  verticalHelper.style.left = `-2000px`;
  verticalHelper.style.top = `-2000px`;
});
