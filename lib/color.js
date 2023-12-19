function decToHex(dec) {
  return dec.toString(16);
}

function padToTwo(str) {
  return str.padStart(2, "0");
}

function rgbToHex(r, g, b) {
  const hexR = padToTwo(decToHex(r));
  const hexG = padToTwo(decToHex(g));
  const hexB = padToTwo(decToHex(b));

  return `#${hexR}${hexG}${hexB}`;
}

function random(max) {
  return Math.floor(Math.random() * (max + 1));
}
function randomColorHex() {
  return rgbToHex(random(0xff), random(0xff), random(0xff));
}
function randomColorRgb() {
  return `rgb(${random(0xff)},${random(0xff)},${random(0xff)})`;
}
function randomColorRgba(r, g, b, a) {
  r ??= random(0xff);
  g ??= random(0xff);
  b ??= random(0xff);
  a ??= Math.random().toFixed(2);
  return `rgb(${r},${g},${b},${a})`;
}
const Color = { decToHex, padToTwo, rgbToHex, random, randomColorHex, randomColorRgb, randomColorRgba };
export default Color;
