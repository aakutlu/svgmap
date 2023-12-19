import Zoomer from "../lib/zoomer.js";
import Color from "../lib/color.js";
let myMap = undefined;
let LABELS = true;
let DATAS = true;
$(document).ready(async () => {
  myMap = new SvgMap("maps/10_balıkesir.svg", $("#mapcontainer")[0], null);
  await myMap.init();
  window.myMap = myMap;

  document.querySelector(".btns button:nth-child(1)").addEventListener("click", (event) => {
    event.preventDefault();
    LABELS ? myMap.hideLabels() : myMap.showLabels();
    LABELS = !LABELS;
  });
  document.querySelector(".btns button:nth-child(2)").addEventListener("click", (event) => {
    event.preventDefault();
    DATAS ? myMap.hideDatas() : myMap.showDatas();
    DATAS = !DATAS;
  });

  //ZOOMER set up Listeners
  let svg = document.querySelector("#mapcontainer svg");
  let zoom_in_btn = document.getElementById("zoom-in");
  let zoom_out_btn = document.getElementById("zoom-out");
  let zoom_default_btn = document.getElementById("zoom-default");
  let btn1 = document.getElementById("btn1");

  let myZoomer = new Zoomer(svg);
  btn1.addEventListener("click", () => {
    myZoomer.zoomAnimation(myZoomer.getViewBoxArr(), [90, 30, 82, 35]);
  });
  zoom_in_btn.addEventListener("click", (event) => {
    myZoomer.zoomin();
  });
  zoom_out_btn.addEventListener("click", (event) => {
    myZoomer.zoomout();
  });
  zoom_default_btn.addEventListener("click", (event) => {
    myZoomer.reset();
  });
  svg.addEventListener("wheel", (event) => {
    myZoomer.wheelzoom(event);
  });
  svg.addEventListener("mousemove", (event) => {
    if (event.buttons === 1 && event.type === "mousemove") {
      myZoomer.shift(event);
    }
  });
  svg.addEventListener("mousedown", (event) => {
    myZoomer.setStart(event);
  });
  svg.addEventListener("mouseup", (event) => {
    event.target.style.cursor = "auto";
  });
  // (end) ZOOMER set up Listeners

  let list = myMap.getIds().map((elem) => {
    return { id: elem, color: Color.randomColorRgba() };
  });
  //myMap.setState({ name: "state1", features: list });

  myMap.setState({
    name: "state1",
    features: [
      { id: "türkiye", color: Color.randomColorRgba() },
      { id: "karadeniz", color: Color.randomColorRgba() },
      { id: "marmara", color: Color.randomColorRgba() },
      { id: "ege", color: Color.randomColorRgba() },
      { id: "akdeniz", color: Color.randomColorRgba() },
      { id: "doguanadolu", color: Color.randomColorRgba() },
      { id: "icanadolu", color: Color.randomColorRgba() },
      { id: "guneydoguanadolu", color: Color.randomColorRgba() },
    ],
  });

  test();

  //myMap.minimap({ x: 83, y: 28, width: 20, height: 10 }, 3, { x: 100, y: -10 }, "minimap-istanbul");
  //myMap.minimap({ x: 35, y: 190, width: 40, height: 20 }, 2.5, { x: -40, y: 230 }, "minimap-izmir");
});

function test() {
  /*
  myMap.getFeature("samsun").setLabel("new Data");
  console.log(myMap.getFeature("samsun").getLabel());
  myMap.getFeature("samsun").hideLabel();
  myMap.getFeature("samsun").showLabel();
  myMap.getFeature("samsun").setColor("pink");
  myMap.getFeature("samsun").mark();
  myMap.getFeature("ankara").mark();
  myMap.getFeature("angora")?.mark();
  myMap.getFeature("samsun").undoMark();
  myMap.mark(["erzurum", "kars", "erzincan"]);
  myMap.undoMark(["erzurum", "kars", "erzincan"]);
  let allCities = [...myMap.getIds()];
  myMap.mark([...myMap.getIds()]);
  myMap.undoMark([...myMap.getIds()]);
  myMap.mark([...myMap.getIds()]); 
  */
  let allCities = [...myMap.getIds()];
  //let group = Object.groupBy(allCities, (id) => id.slice(0, 2));
  //console.log(JSON.stringify(group));
  //console.log(allCities);
  allCities.forEach((id) => {
    myMap.getFeature(id).setColor(Color.randomColorRgba());
  });
  allCities.forEach((id) => {
    myMap.getFeature(id).hideData();
    myMap.hideLabels();
  });
}
