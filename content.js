window.lastRightClickEvent = null;
document.addEventListener("contextmenu", (e) => {
  window.lastRightClickEvent = e;
});
