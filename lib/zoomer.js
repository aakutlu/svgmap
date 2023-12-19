export default class Zoomer {
  constructor(svgElement, sensitivity = 0.2) {
    this.target = svgElement;
    this.defaultViewBox = svgElement.getAttribute("viewBox");
    this.sensitivity = sensitivity;
    this.mouseStart = null;
    this.pivot = null;
  }

  getViewBox = function () {
    return this.target.getAttribute("viewBox");
  };
  getViewBoxArr = function () {
    return this.getViewBox()
      .trim()
      .split(/\s{1,}/)
      .map((elem) => parseFloat(elem));
  };
  setViewBox = function (viewBox) {
    if (typeof viewBox === "string") this.target.setAttribute("viewBox", viewBox);
    else if (Array.isArray(viewBox)) {
      this.target.setAttribute("viewBox", viewBox.join(" "));
    } else console.warn("Wrong viewBox Format", { viewBox });
  };
  reset = function () {
    this.target.setAttribute("viewBox", this.defaultViewBox);
  };
  zoomin = function (px, py) {
    /**
     * zoomPercentage: range [0,1]    zoom sensitivity
     * px            : range [0,1]    zoom pivot point percentage on horizontal axis
     * py            : range [0,1]    zoom pivot point percentage on vertical axis
     */
    px = parseFloat(px) || 0.5;
    py = parseFloat(py) || 0.5;
    let se = this.sensitivity;
    let viewBoxArr = this.getViewBox()
      .trim()
      .split(/\s{1,}/)
      .map((elem) => parseFloat(elem));
    let [x, y, w, h] = [...viewBoxArr];
    let _w = w - Math.round(se * w);
    let _h = h - Math.round(se * h);
    let _x = x + Math.abs(w - _w) * px;
    let _y = y + Math.abs(h - _h) * py;
    let _viewBox = [_x, _y, _w, _h].join(" ");
    this.setViewBox(_viewBox);
  };

  zoomout = function (px, py) {
    /**
     * zoomPercentage: range [0,1]    zoom sensitivity
     * px            : range [0,1]    zoom pivot point percentage on horizontal axis
     * py            : range [0,1]    zoom pivot point percentage on vertical axis
     */
    px = parseFloat(px) || 0.5;
    py = parseFloat(py) || 0.5;
    let se = this.sensitivity;
    let viewBoxArr = this.getViewBox()
      .trim()
      .split(/\s{1,}/)
      .map((elem) => parseFloat(elem));
    let [x, y, w, h] = [...viewBoxArr];
    let _w = w + Math.round(se * w);
    let _h = h + Math.round(se * h);
    let _x = x - Math.abs(w - _w) * px;
    let _y = y - Math.abs(h - _h) * py;
    let _viewBox = [_x, _y, _w, _h].join(" ");
    this.setViewBox(_viewBox);
  };

  wheelzoom = function (event) {
    event.preventDefault();
    let DOMRECT = this.target.getBoundingClientRect();
    if (event.deltaY < 0) {
      this.zoomin((event.offsetX / DOMRECT.width).toFixed(1), (event.offsetY / DOMRECT.height).toFixed(1));
    } else {
      this.zoomout((event.offsetX / DOMRECT.width).toFixed(1), (event.offsetY / DOMRECT.height).toFixed(1));
    }
  };
  shift = function (event) {
    if (event.buttons === 1 && event.type === "mousemove") {
      let DOMRECT = this.target.getBoundingClientRect();
      event.target.style.cursor = "move";
      let [_x, _y, _w, _h] = this.getViewBoxArr();
      let dx = this.mouseStart.x - (event.offsetX / DOMRECT.width) * _w;
      let dy = this.mouseStart.y - (event.offsetY / DOMRECT.height) * _h;
      let _viewBox = [this.pivot.x + dx, this.pivot.y + dy, _w, _h].join(" ");
      this.setViewBox(_viewBox);
    }
  };
  setStart = function (event) {
    let DOMRECT = this.target.getBoundingClientRect();
    let [_x, _y, _w, _h] = this.getViewBoxArr();
    this.pivot = { x: _x, y: _y };
    this.mouseStart = { x: (event.offsetX / DOMRECT.width) * _w, y: (event.offsetY / DOMRECT.height) * _h };
  };
  zoomAnimation(viewBox1, viewBox2) {
    console.log(viewBox1, viewBox2);
    viewBox1 = this.getViewBoxArr();
    this.animate(viewBox1, viewBox2, 500, function () {
      console.log(arguments);
      let [base, target, percent, zoomer] = [...arguments];
      console.log(base, target, percent, zoomer);
      let [_x, _y, _w, _h] = base;
      let [x, y, w, h] = target;
      let dx = _x + (x - _x) * percent;
      let dy = _y + (y - _y) * percent;
      let dw = _w + (w - _w) * percent;
      let dh = _h + (h - _h) * percent;
      zoomer.setViewBox([dx, dy, dw, dh]);
    });
  }
  animate(baseState, targetState, duration, job) {
    const interval = duration / 1000;
    const timeStart = Date.now();
    console.log(timeStart);
    const intervalID = setInterval(this.stepFunction, interval, baseState, targetState, duration, timeStart, this, job);
    setTimeout(() => {
      clearInterval(intervalID);
    }, duration);
  }
  stepFunction(base, target, duration, timeStart, zoomer, job) {
    const currTime = Date.now();
    const step = (currTime - timeStart) / duration;
    //const value = quadraticBezier(base, 30, target, step);
    //const value = cubicBezier(base, 400, 900, target, step);
    //const percent = cubicBezier(0.34, 1.56, 0.64, 1, step);
    //const percent = cubicBezier(0, 1.56, -0.64, 1, step);
    //const percent = cubicBezier(0.25, 0.1, 0.25, 1, step); //ease
    //let percent = Zoomer.cubicBezier(0, 0, 1, 1, step); //linear
    //console.log({ percent });
    //const percent = cubicBezier(0.42, 0, 1, 1, step); //ease-in
    //const percent = cubicBezier(0, 0, 0.58, 1, step); //ease-out
    const percent = Zoomer.cubicBezier(0, 0.3, 0.7, 1, step); //ease-in-out
    /* item.setAttribute("style", `left:${base + (target - base) * percent}px`); */
    //job.bind(this);
    job(base, target, percent, zoomer);
  }
  /* The Math is from => https://blog.maximeheckel.com/posts/cubic-bezier-from-math-to-motion/*/
  linearInterpolation(p0, p1, t) {
    /*  P = (1-t)*P0 + t*P1  */
    return (1 - t) * p0 + t * p1;
  }
  quadraticBezier(p0, p1, p2, t) {
    /*  P = (1-t)**2 * P0 + 2*(1-t)*t * P1 + t**2 * P2   */
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;
  }
  static cubicBezier(p0, p1, p2, p3, t) {
    /*  P = (1-t)**3 * P0 + t*P1*(3*(1-t)**2) + P2*(3*(1-t)*t**2) + P3*t**3   */
    return (1 - t) ** 3 * p0 + t * p1 * (3 * (1 - t) ** 2) + p2 * (3 * (1 - t) * t ** 2) + p3 * t ** 3;
  }
}

//export default Zoomer;
