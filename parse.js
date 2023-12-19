var markerRegEx = /[MmLlSsQqLlHhVvCcSsQqTtAaZz]/g;
var digitRegEx = /-?[0-9]*\.?\d+/g;

function svgPathToCommands(str) {
  var results = [];
  var match;
  while ((match = markerRegEx.exec(str)) !== null) {
    results.push(match);
  }
  return results
    .map(function (match) {
      return { marker: str[match.index], index: match.index };
    })
    .reduceRight(function (all, cur) {
      var chunk = str.substring(cur.index, all.length ? all[all.length - 1].index : str.length);
      return all.concat([{ marker: cur.marker, index: cur.index, chunk: chunk.length > 0 ? chunk.substr(1, chunk.length - 1) : chunk }]);
    }, [])
    .reverse()
    .map(function (command) {
      var values = command.chunk.match(digitRegEx);
      return { marker: command.marker, values: values ? values.map(parseFloat) : [] };
    });
}

function commandsToSvgPath(commands) {
  return commands
    .map(function (command) {
      return command.marker + " " + command.values.join(",");
    })
    .join(" ")
    .trim();
}

function commandsToPoints(commands) {
  //wworks well except for 'CSQTAcsqta' and multiple valued 'HVhv' tags
  //console.log("fn called");
  //console.log(commands);
  let i = 0;
  let k = -1;
  let paths = []; //[ [{x:0,y:0},{x:0,y:0},{x:0,y:0}],,,]
  let prev = { x: 0, y: 0 };
  while (i < commands.length) {
    let pArr = commands[i].values;
    let marker = commands[i].marker;
    //console.log(marker);
    //console.log({ marker, pArr });
    //console.log({ paths });

    let j = 0;
    do {
      //console.log({ i, j, k });
      if (marker === "M") {
        if (j == 0) {
          k++;
          paths[k] = [];
        }
        prev = { x: pArr[j], y: pArr[j + 1] };
        paths[k].push({ ...prev });
      }
      if (marker === "m") {
        if (j == 0) {
          k++;
          paths[k] = [];
        }
        prev = { x: pArr[j] + prev.x, y: pArr[j + 1] + prev.y };
        paths[k].push({ ...prev });
      }
      if (marker === "L") {
        prev = { x: pArr[j], y: pArr[j + 1] };
        paths[k].push({ ...prev });
      }
      if (marker === "l") {
        prev = { x: pArr[j] + prev.x, y: pArr[j + 1] + prev.y };
        paths[k].push({ ...prev });
      }
      if (marker === "H") {
        prev = { x: pArr[j], y: prev.y };
        paths[k].push({ ...prev });
      }
      if (marker === "h") {
        prev = { x: pArr[j] + prev.x, y: prev.y };
        paths[k].push({ ...prev });
      }
      if (marker === "V") {
        prev = { x: prev.x, y: pArr[j] };
        paths[k].push({ ...prev });
      }
      if (marker === "v") {
        prev = { x: prev.x, y: pArr[j] + prev.y };
        paths[k].push({ ...prev });
      }
      if (marker === "z" || marker === "Z") {
        prev = { x: paths[k][0].x, y: paths[k][0].y };
        //console.error(marker, prev);
      }
      j += 2;
      //console.log(JSON.stringify(paths[k].map((e) => [e.x, e.y])));
    } while (j < pArr.length);
    i++;
  }
  return paths;
}

let FN = {
  convertToPolygons: function (commands) {
    let polygons = [];
    while (commands.length > 0) {
      let command = commands.shift();
      let marker = command.marker;
      let values = command.values;
      FN[marker](polygons, values);
    }
    return polygons;
  },
  M: function (polygons, values) {
    let xyArr = chunkArrayInGroups(values, 2);
    let points = xyArr.map((a) => {
      return { x: a[0], y: a[1] };
    });
    polygons.push(points);
    return polygons;
  },
  m: function (polygons, values) {
    let last = polygons?.at(-1)?.at(-1) || { x: 0, y: 0 };
    polygons.push([]);
    let xyArr = chunkArrayInGroups(values, 2); // [x1,y1,x2,y2,...] => [[x1,y1],[x2,y2],...]
    xyArr.forEach((a) => {
      last = { x: a[0] + last.x, y: a[1] + last.y };
      polygons.at(-1).push({ x: last.x, y: last.y });
    });
    return polygons;
  },
  L: function (polygons, values) {
    let xyArr = chunkArrayInGroups(values, 2);
    let points = xyArr.map((a) => {
      return { x: a[0], y: a[1] };
    });
    polygons.at(-1).push(...points);
    return polygons;
  },
  l: function (polygons, values) {
    let last = polygons?.at(-1)?.at(-1) || { x: 0, y: 0 };
    let xyArr = chunkArrayInGroups(values, 2); // [x1,y1,x2,y2,...] => [[x1,y1],[x2,y2],...]
    xyArr.forEach((a) => {
      last = { x: a[0] + last.x, y: a[1] + last.y };
      polygons.at(-1).push({ x: last.x, y: last.y });
    });
    return polygons;
  },
  H: function (polygons, values) {
    let last = polygons?.at(-1)?.at(-1) || { x: 0, y: 0 };
    let points = values.map((num) => {
      return { x: num, y: last.x };
    });
    polygons.at(-1).push(...points);
    return polygons;
  },
  h: function (polygons, values) {
    let last = polygons?.at(-1)?.at(-1) || { x: 0, y: 0 };
    values.forEach((num) => {
      last = { x: num + last.x, y: last.y };
      polygons.at(-1).push({ x: last.x, y: last.y });
    });
    return polygons;
  },
  V: function (polygons, values) {
    let last = polygons?.at(-1)?.at(-1) || { x: 0, y: 0 };
    let points = values.map((num) => {
      return { x: last.x, y: num };
    });
    polygons.at(-1).push(...points);
    return polygons;
  },
  v: function (polygons, values) {
    let last = polygons?.at(-1)?.at(-1) || { x: 0, y: 0 };
    values.forEach((num) => {
      last = { x: last.x, y: num + last.y };
      polygons.at(-1).push({ x: last.x, y: last.y });
    });
    return polygons;
  },
  C: function (polygons, values) {
    return FN.L(polygons, values);
  },
  c: function (polygons, values) {
    return FN.l(polygons, values);
  },
  S: function (polygons, values) {
    return FN.L(polygons, values);
  },
  s: function (polygons, values) {
    return FN.l(polygons, values);
  },
  Q: function (polygons, values) {
    return FN.L(polygons, values);
  },
  q: function (polygons, values) {
    return FN.l(polygons, values);
  },
  T: function (polygons, values) {
    return FN.L(polygons, values);
  },
  t: function (polygons, values) {
    return FN.l(polygons, values);
  },
  Z: function (polygons, values) {
    let head = polygons.at(-1)[0];
    polygons.at(-1).push({ x: head.x, y: head.y });
    return polygons;
  },
  z: function (polygons, values) {
    return FN.Z(polygons, values);
  },
};

function chunkArrayInGroups(arr, size) {
  var result = [];
  for (var i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}
