const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
class Feature {
  constructor(id, label, data, color = "gray", domElement, settings) {
    this.id = id;
    this.label = label;
    this.data = data;
    this.color = color;
    this.domElement = domElement;
    this.minimapElementList = [];
    this.labelTextElement = null;
    this.dataTextElement = null;
    $(this.domElement).attr("fill", color);
  }
  setLabel = (label) => {
    this.label = label;
    this.getLabelElement().textContent = this.label;
  };
  getLabel = () => {
    return this.label;
  };
  setLabelElement = (labelElem) => {
    this.labelTextElement = labelElem;
  };
  getLabelElement = () => {
    return this.labelTextElement;
  };
  hideLabel = () => {
    $(this.labelTextElement).css("visibility", "hidden");
  };
  showLabel = () => {
    $(this.labelTextElement).css("visibility", "visible");
  };
  setData = (data) => {
    this.data = data;
    this.getDataElement().textContent = this.data;
  };
  getData = () => {
    return this.data;
  };
  setDataElement = (dataElem) => {
    this.dataTextElement = dataElem;
  };
  getDataElement = () => {
    return this.dataTextElement;
  };
  hideData = () => {
    $(this.dataTextElement).css("visibility", "hidden");
  };
  showData = () => {
    $(this.dataTextElement).css("visibility", "visible");
  };
  setColor = (color) => {
    this.color = color;
    $(this.domElement).attr("fill", color);
    this.minimapElementList.forEach((dom) => {
      $(dom).attr("fill", color);
    });
  };
  getColor = () => {
    return this.color;
  };
  mark = () => {
    $(this.domElement)?.attr("stroke", "black");
  };
  undoMark = () => {
    $(this.domElement).removeAttr("stroke");
  };
  getBBox = () => {
    return $(this.domElement)[0].getBBox();
  };
  getVectorCenter = () => {
    let pathStr = $(this.domElement).find("path").attr("d");
    if (!pathStr) return { x: 0, y: 0 };
    let commands = svgPathToCommands(pathStr);
    //console.log({ commands });
    let pathList = commandsToPoints(commands);
    let massArr = pathList.map((points) => {
      return { mass: polygonArea(points), x: cx(points), y: cy(points) };
    });

    let { mass, x, y } = massCenter(massArr);

    return { mass, x, y };
  };
  getAllPoints = () => {
    let pathStr = $(this.domElement).find("path").attr("d");
    if (!pathStr) return [];
    let commands = svgPathToCommands(pathStr);
    let pointArr = commandsToPoints(commands);
    let points = pointArr.reduce((accu, curr) => {
      return [...accu, ...curr];
    }, []);
    return points;
  };

  getBBoxCenter = () => {
    let bbox = this.getBBox();
    return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
  };
}

class SvgMap {
  #DEFAULT_STATE = {
    background_color: "radial-gradient(at left top, #FFFFFF, #C7C7C4)",
    border_color: "black", //stroke color
    feature_color: "gray", //fill color
    show_feature_names: true,
    show_feature_data: true,
  };

  constructor(svgurl, container, state) {
    this.svgUrl = svgurl;
    this.container = container;
    this.state = { ...this.#DEFAULT_STATE, ...state };
    this.svgText = undefined;
    this.features = []; // {}
  }
  zoomCounty(zoomer, countyId) {
    let target = this.getFeature(countyId).getBBox();
    zoomer.zoomAnimation(undefined, target);
  }
  init = async () => {
    this.svgText = await this.fetchSvg(this.svgUrl);
    $(this.container).empty();
    $(this.container).append(this.svgText);
    this.initFeatures();
    this.initLabels();
    this.initData();
    console.warn("SvgMap initialization complete");
  };

  initFeatures = () => {
    const FEATURES = this.features;
    $(this.container)
      .find("#features > g")
      .each(function (index) {
        const id = $(this).attr("id");
        const name = $(this).attr("name");
        const type = $(this).attr("data-type");
        FEATURES.push(new Feature(id, name, Math.random(), "gray", this, { settings: {} }));
      });
  };
  initLabels = () => {
    const NAMESPACE = "http://www.w3.org/2000/svg";
    const fragment = document.createDocumentFragment();

    //check if the container _<g id="labels"/>_  exist
    let labelContainer = $(this.container).find("#labels")[0];
    if (!labelContainer) {
      $(this.container).find("svg")[0].insertAdjacentHTML("beforeend", `<g id="labels"></g>`);
      labelContainer = $(this.container).find("#labels")[0];
    }
    this.features?.forEach((feature) => {
      const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      let data_textPath = feature.domElement.getAttribute("data-textpath");
      let data_fontSize = feature.domElement.getAttribute("data-fontsize");

      let textElem = document.createElementNS(NAMESPACE, "text");
      let pathElem = document.createElementNS(NAMESPACE, "path");
      let textPathElem = document.createElementNS(NAMESPACE, "textPath");

      pathElem.setAttribute("id", uniqueId);
      pathElem.setAttribute("d", data_textPath);
      textPathElem.setAttribute("href", `#${uniqueId}`);
      textPathElem.setAttribute("startOffset", "50%");
      textPathElem.textContent = feature.getLabel();

      textElem.setAttribute("dominant-baseline", "auto");
      textElem.setAttribute("text-anchor", "start");
      textElem.append(pathElem);
      textElem.style.fontSize = data_fontSize;
      textElem.append(textPathElem);

      fragment.appendChild(textElem);
      feature.setLabelElement(textElem);
    });
    labelContainer.appendChild(fragment);
  };

  initData = () => {
    const NAMESPACE = "http://www.w3.org/2000/svg";
    const fragment = document.createDocumentFragment();

    //check if the label container exist
    let dataContainer = $(this.container).find("#datas")[0];
    if (!dataContainer) {
      $(this.container).find("svg")[0].insertAdjacentHTML("beforeend", `<g id="datas"></g>`);
      dataContainer = $(this.container).find("#datas")[0];
    }

    this.features?.forEach((feature) => {
      const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      let data_textPath = feature.domElement.getAttribute("data-textpath");
      let data_fontSize = feature.domElement.getAttribute("data-fontsize");
      data_fontSize = parseFloat(data_fontSize.split("px")[0]);
      data_fontSize *= 0.4;

      let textElem = document.createElementNS(NAMESPACE, "text");
      let pathElem = document.createElementNS(NAMESPACE, "path");
      let textPathElem = document.createElementNS(NAMESPACE, "textPath");

      pathElem.setAttribute("id", uniqueId);
      pathElem.setAttribute("d", data_textPath);
      textPathElem.setAttribute("href", `#${uniqueId}`);
      textPathElem.setAttribute("startOffset", "50%");
      textPathElem.textContent = feature.getData();

      textElem.setAttribute("dominant-baseline", "hanging");
      textElem.setAttribute("text-anchor", "start");
      textElem.append(pathElem);
      textElem.style.fontSize = `${data_fontSize}px`;
      textElem.style.fontWeight = 500;
      textElem.append(textPathElem);

      fragment.appendChild(textElem);
      feature.setDataElement(textElem);
    });
    dataContainer.appendChild(fragment);
  };

  insertPolygons = (pointsArr, groupId) => {
    const fragment = document.createDocumentFragment();
    pointsArr.forEach((elem) => {
      let polyElem = document.createElementNS(SVG_NAMESPACE, "polygon");
      polyElem.setAttribute("id", elem.id);
      polyElem.setAttribute("label", elem.label);
      polyElem.setAttribute("points", elem.points.map((elem) => elem.x + "," + elem.y).join(" "));
      fragment.appendChild(polyElem);
    });
    //container.appendChild(fragment);
    this.insertFragment(fragment, groupId);
  };
  insertMinimapPolygons = (pointsArr, groupId) => {
    const fragment = document.createDocumentFragment();
    pointsArr.forEach((elem) => {
      let polyElem = document.createElementNS(SVG_NAMESPACE, "polygon");
      this.getFeature(elem.id)?.minimapElementList.push(polyElem);
      let color = this.getFeature(elem.id).getColor();
      polyElem.setAttribute("id", elem.id + Date.now());
      polyElem.setAttribute("label", elem.label);
      polyElem.setAttribute("fill", color);
      polyElem.setAttribute("opacity", "1");
      polyElem.setAttribute("points", elem.points.map((elem) => elem.x + "," + elem.y).join(" "));
      fragment.appendChild(polyElem);
    });
    //container.appendChild(fragment);
    this.insertFragment(fragment, groupId);
    console.log(fragment);
  };

  insertPolygon = (data, groupId) => {
    const fragment = document.createDocumentFragment();
    let polgonElem = document.createElementNS(SVG_NAMESPACE, "polygon");
    //if data is array, convert it to string
    if (Array.isArray(data)) {
      data = data.map((point) => point.x + "," + point.y).join(" ");
    }
    polgonElem.setAttribute("points", data);
    fragment.appendChild(polgonElem);
    this.insertFragment(fragment, groupId);
  };

  insertPath = (data, groupId) => {
    const fragment = document.createDocumentFragment();
    let pathElem = document.createElementNS(SVG_NAMESPACE, "path");
    //if data is array, convert it to string
    if (Array.isArray(data)) {
      data = "M" + data.map((point) => point.x + "," + point.y).join(" ") + "z";
    }
    pathElem.setAttribute("d", data);
    fragment.appendChild(pathElem);
    this.insertFragment(fragment, groupId);
  };
  insertRect = (data, groupId) => {
    const fragment = document.createDocumentFragment();
    let rectElem = document.createElementNS(SVG_NAMESPACE, "rect");
    rectElem.setAttribute("x", data.x);
    rectElem.setAttribute("y", data.y);
    rectElem.setAttribute("width", data.width);
    rectElem.setAttribute("height", data.height);
    rectElem.setAttribute("fill", data.fill);
    rectElem.setAttribute("opacity", 1);
    rectElem.setAttribute("stroke", "black");
    rectElem.setAttribute("stroke-width", ".5");
    fragment.appendChild(rectElem);
    this.insertFragment(fragment, groupId);
  };
  insertLine = (data, groupId) => {
    const fragment = document.createDocumentFragment();
    let lineElem = document.createElementNS(SVG_NAMESPACE, "line");
    lineElem.setAttribute("x1", data.x1);
    lineElem.setAttribute("y1", data.y1);
    lineElem.setAttribute("x2", data.x2);
    lineElem.setAttribute("y2", data.y2);
    lineElem.setAttribute("stroke-dasharray", ".5 .5");
    lineElem.setAttribute("stroke-linecap", "butt");
    lineElem.setAttribute("stroke", "black");
    lineElem.setAttribute("stroke-width", ".5");
    lineElem.setAttribute("opacity", ".7");
    fragment.appendChild(lineElem);
    this.insertFragment(fragment, groupId);
  };
  insertNum = (data, groupId) => {
    const fragment = document.createDocumentFragment();
    let textElem = document.createElementNS(SVG_NAMESPACE, "text");
    textElem.setAttribute("x", data.x);
    textElem.setAttribute("y", data.y);
    textElem.setAttribute("fill", "black");
    textElem.setAttribute("style", "font-weight:300;font-size:.2em;text-anchor:center");
    textElem.setAttribute("dominant-baseline", "center");
    textElem.textContent = data.content;
    fragment.appendChild(textElem);
    this.insertFragment(fragment, groupId);
  };

  insertFragment = (fragment, groupId) => {
    //check if the label container exist
    let groupContainer = $(this.container).find(`#${groupId}`)[0];
    if (!groupContainer) {
      $(this.container).find("svg")[0].insertAdjacentHTML("beforeend", `<g id="${groupId}"></g>`);
      groupContainer = $(this.container).find(`#${groupId}`)[0];
    }
    groupContainer.appendChild(fragment);
  };

  setFeatureColor = (ids, color) => {
    ids = ids instanceof Array ? ids : [ids];
    ids.forEach((id) => {
      this.getFeature(id)?.setColor(color);
    });
  };
  getFeature = (id) => {
    return this.features.find((elem) => {
      return elem.id == id;
    });
  };
  getIds = () => {
    return this.features.map((f) => f.id);
  };
  mark = (ids) => {
    ids = ids instanceof Array ? ids : [ids];
    ids.forEach((id) => {
      this.getFeature(id)?.mark();
    });
  };
  undoMark = (ids) => {
    ids = ids instanceof Array ? ids : [ids];
    ids.forEach((id) => {
      this.getFeature(id)?.undoMark();
    });
  };
  hideDatas = () => {
    this.features.forEach((f) => {
      f.hideData();
    });
  };
  showDatas = () => {
    this.features.forEach((f) => {
      f.showData();
    });
  };
  hideLabels = () => {
    this.features.forEach((f) => {
      f.hideLabel();
    });
  };
  showLabels = () => {
    this.features.forEach((f) => {
      f.showLabel();
    });
  };
  fetchSvg = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      const message = `An Error has occured: ${response.status}`;
      throw new Error(message);
    }
    const svg = response.text();
    return svg;
  };

  refresh = () => {
    // ???
    if (this.svgText) {
      $(this.container).empty();
      $(this.container).append(this.svgText);
    }
  };

  download = (e, dimensions) => {
    const canvas = document.createElement("canvas");
    //const svg = document.querySelector("svg");
    const svg = $(this.container).find("svg")[0];
    const base64doc = btoa(unescape(encodeURIComponent(svg.outerHTML)));
    let viewBoxStr = svg.getAttribute("viewBox");
    const viewBoxArr = viewBoxStr
      .trim()
      .split(/\s{1,}/)
      .map((str) => parseInt(str));

    let w = dimensions?.width || viewBoxArr[2] || 1920;
    let h = dimensions?.height || viewBoxArr[3] || 1080;
    w *= 2;
    h *= 2;
    const img_to_download = document.createElement("img");
    img_to_download.src = "data:image/svg+xml;base64," + base64doc;
    console.log(w, h);
    img_to_download.onload = function () {
      console.log("img loaded");
      canvas.setAttribute("width", w);
      canvas.setAttribute("height", h);
      const context = canvas.getContext("2d");
      //context.clearRect(0, 0, w, h);
      context.drawImage(img_to_download, 0, 0, w, h);
      const dataURL = canvas.toDataURL("image/png");
      if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(canvas.msToBlob(), "download.png");
        //e.preventDefault();
      } else {
        const a = document.createElement("a");
        const my_evt = new MouseEvent("click");
        a.download = "download.png";
        a.href = dataURL;
        a.dispatchEvent(my_evt);
      }
      //canvas.parentNode.removeChild(canvas);
    };
  };

  minimap = (rect, scale, pivot, containerName) => {
    //scale lines
    this.insertLine({ x1: rect.x, y1: rect.y, x2: pivot.x, y2: pivot.y }, containerName);
    this.insertLine({ x1: rect.x + rect.width, y1: rect.y, x2: pivot.x + rect.width * scale, y2: pivot.y }, containerName);
    this.insertLine({ x1: rect.x, y1: rect.y + rect.height, x2: pivot.x, y2: pivot.y + rect.height * scale }, containerName);
    this.insertLine(
      { x1: rect.x + rect.width, y1: rect.y + rect.height, x2: pivot.x + rect.width * scale, y2: pivot.y + rect.height * scale },
      containerName
    );
    //mini rect
    this.insertLine({ x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y }, containerName);
    this.insertLine({ x1: rect.x + rect.width, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height }, containerName);
    this.insertLine({ x1: rect.x, y1: rect.y + rect.height, x2: rect.x + rect.width, y2: rect.y + rect.height }, containerName);
    this.insertLine({ x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.height }, containerName);

    //zoomed pane
    this.insertRect({ ...{ width: rect.width * scale, height: rect.height * scale }, ...{ fill: "white" }, ...pivot }, containerName);
    //this.insertRect({ ...rect, ...{ fill: "red" } }, containerName);

    let features = this.features.map((feature) => {
      return {
        id: feature.id,
        label: feature.getLabel,
        dPath: feature.domElement.querySelector("path").getAttribute("d"),
      };
    });

    let polygons = [];
    features.forEach((f) => {
      let pointsArrArr = commandsToPoints(svgPathToCommands(f.dPath));
      pointsArrArr.forEach((arr, i) => {
        let id = f.id;
        if (arr.some((point) => isPointInside(point, rect))) {
          polygons.push({
            name: id,
            points: trimFeatureArea(arr, rect),
          });
        }
      });
    });

    let cities = polygons.map((obj) => {
      return { id: obj.name, label: obj.name, points: obj.points };
    });

    cities.forEach((elem) => {
      elem.points = elem.points.map((point) => {
        return {
          x: (point.x - rect.x) * scale + pivot.x,
          y: (point.y - rect.y) * scale + pivot.y,
        };
      });
    });

    this.insertMinimapPolygons(cities, containerName);
  };
  setState = (state) => {
    //let ids = spread(state.features)
    state.features.forEach((obj) => {
      let key = obj.id;
      let ids = spread([key]); //groups[key] ? [...groups[key]] : [key];
      //console.log(ids);
      //console.log([...groups[key]]);
      //console.log([key]);
      this.setFeatureColor(ids, obj.color);
    });
  };
}

function spread(nameArr) {
  let groups = {
    karadeniz: ["dogukaradeniz", "ortakaradeniz", "batıkaradeniz"],
    dogukaradeniz: ["artvin", "rize", "trabzon", "bayburt", "gümüşhane", "giresun", "ordu"],
    ortakaradeniz: ["samsun", "sinop", "kastamonu", "amasya", "tokat", "çorum"],
    batıkaradeniz: ["bartın", "zonguldak", "düzce", "bolu", "karabük"],
    marmara: ["istanbul", "kocaeli", "sakarya", "bilecik", "bursa", "yalova", "balıkesir", "çanakkale", "tekirdağ", "kırklareli", "edirne"],
    ege: ["izmir", "aydın", "muğla", "manisa", "denizli", "uşak", "kütahya", "afyonkarahisar"],
    akdeniz: ["ısparta", "burdur", "adana", "antalya", "mersin", "kahramanmaraş", "osmaniye", "hatay"],
    icanadolu: [
      "ankara",
      "kırıkkale",
      "çankırı",
      "eskişehir",
      "kırşehir",
      "nevşehir",
      "yozgat",
      "sivas",
      "kayseri",
      "aksaray",
      "niğde",
      "karaman",
      "konya",
    ],
    doguanadolu: [
      "bingöl",
      "malatya",
      "elazığ",
      "tunceli",
      "erzincan",
      "erzurum",
      "van",
      "hakkari",
      "ağrı",
      "bitlis",
      "muş",
      "ığdır",
      "kars",
      "ardahan",
    ],
    guneydoguanadolu: ["kilis", "gaziantep", "şanlıurfa", "adıyaman", "diyarbakır", "mardin", "batman", "siirt", "şırnak"],
    dogu: ["guneydoguanadolu", "doguanadolu", "dogukaradeniz"],
    batı: ["ege", "marmara", "batıkaradeniz"],
    türkiye: ["doguanadolu", "guneydoguanadolu", "icanadolu", "akdeniz", "ege", "marmara", "karadeniz"],
  };
  let i = 0;
  while (nameArr[i]) {
    let region = nameArr[i];

    if (groups[region]) {
      extracted = nameArr.splice(i, 1);
      nameArr = [...nameArr, ...groups[extracted]];
      i--;
    }
    i++;
  }
  return nameArr;
}

function trimFeatureArea(points, rect) {
  return points.map((point) => {
    return projectilePoint(point, rect);
  });
}
function projectilePoint(point, rect) {
  /**
   *     1          2          3
   *         +-------------+
   *         |             |
   *     4   |      0      |   5
   *         |             |
   *         +-------------+
   *     6          7          8
   *
   */

  if (isPointInside(point, rect)) {
    return { x: point.x, y: point.y };
  }
  let x1 = rect.x;
  let x2 = rect.x + rect.width;
  let y1 = rect.y;
  let y2 = rect.y + rect.height;
  let myX;
  let myY;

  let dx = Math.min(Math.abs(rect.x - point.x), Math.abs(rect.x + rect.width - point.x));
  let dy = Math.min(Math.abs(rect.y - point.y), Math.abs(rect.y + rect.height - point.y));
  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  if (point.x < x1) {
    //Area 1,4,6
    myX = point.x + dx;
  } else if (point.x > x2) {
    //Area 3,5,8
    myX = point.x - dx;
  } else {
    myX = point.x;
  }
  //YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
  if (point.y < y1) {
    //Area 1,2,3
    myY = point.y + dy;
  } else if (point.y > y2) {
    //Area 6,7,8
    myY = point.y - dy;
  } else {
    myY = point.y;
  }

  return { x: myX, y: myY };
}
function isPointInside(point, rect) {
  if (!point || !rect) {
    console.error("Point or rect nullish, returning false", { point, rect });
    return false;
  }
  if (point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height) {
    return true;
  }
  return false;
}
function isAnyPointInside(points, rect) {
  return points.some((point) => isPointInside(point, rect));
}
function polygonArea(points) {
  /*https://web.archive.org/web/20120229233701/http://paulbourke.net/geometry/polyarea/*/
  let total = 0;
  let p = [...points];
  p.push(p[0]);
  p.forEach((elem, i, arr) => {
    if (arr.length - 1 == i) return;
    total = total + (arr[i].x * arr[i + 1].y - arr[i + 1].x * arr[i].y) / 2;
  });
  return total;
}
function cx(points) {
  /*https://web.archive.org/web/20120229233701/http://paulbourke.net/geometry/polyarea/*/
  let total = 0;
  let p = [...points];
  p.push(p[0]); //new points array like [p1,p2,p3,p1]
  let A = polygonArea(points); // area
  p.forEach((elem, i, arr) => {
    if (arr.length - 1 == i) return;
    total = total + (arr[i].x + arr[i + 1].x) * (arr[i].x * arr[i + 1].y - arr[i + 1].x * arr[i].y);
  });
  return total / (6 * A);
}
function cy(points) {
  /*https://web.archive.org/web/20120229233701/http://paulbourke.net/geometry/polyarea/*/
  let total = 0;
  let p = [...points];
  p.push(p[0]); //new points array like [p1,p2,p3,p1]
  let A = polygonArea(points); // area
  p.forEach((elem, i, arr) => {
    if (arr.length - 1 == i) return;
    total = total + (arr[i].y + arr[i + 1].y) * (arr[i].x * arr[i + 1].y - arr[i + 1].x * arr[i].y);
  });
  return total / (6 * A);
}
function massCenter(arr) {
  //Usage :  massCenter([{mass:8, x:0, y:0},{mass:4, x:3, y:0},{mass:24, x:4, y:3},])
  arr = [...arr];
  while (arr.length > 1) {
    let area1 = arr.shift();
    let area2 = arr.shift();
    let x = area1.x + ((area2.x - area1.x) * area2.mass) / (area1.mass + area2.mass);
    let y = area1.y + ((area2.y - area1.y) * area2.mass) / (area1.mass + area2.mass);
    let mass = area1.mass + area2.mass;
    arr.unshift({ mass, x, y });
  }
  return arr[0];
}
