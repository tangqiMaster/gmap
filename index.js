//起始点坐标
let startLngLat = {
  point: [104.064215, 30.58904], //坐标信息
  tip: [
    //弹窗信息，如果有弹窗信息，放在tip中
    // {
    //   title:"出发点",
    //   content:"开始配送货物"
    // }
  ],
};

// 终点坐标
let endLngLat = {
  point: [104.072425, 30.663503], //终点坐标
  tip: [],
};

//途经点--中途经过的坐标，可以多个，最多16个
let waypoints = [[104.090633, 30.637031]];

// 配送员位置坐标或其他标记点，可以多个
let markers = [
  {
    point: [104.065991, 30.616675],
    tip: [
      {
        title: "配送中",
        content: "还有5公里",
      },
    ],
  },
];

// 起终点、标注点图标路径、大小
let iconSize = 26;
let start_icon = "./imgs/start_icon.png";
let end_icon = "./imgs/end_icon.png";
let marker_icon = "./imgs/driver.gif";

// 自定义规划路线线条配置
let PolylineOption = {
  showDir: false,
  strokeColor: "#FF0033", // 线颜色
  strokeOpacity: 1, // 线透明度
  strokeWeight: 6, // 线宽
  strokeStyle: "solid", // 线样式
  lineJoin: "round", // 折线拐点的绘制样式
};

//基本地图加载、初始化渲染
let map = new AMap.Map("container", {
  resizeEnable: true,
  center: [104.064215, 30.58904], //地图中心点
  zoom: 12, //地图显示的缩放级别
});
init();

// 初始化
function init() {
  // 绘制导航路线
  setPath();

  // 起始终点添加图标
  setMarker(startLngLat.point, start_icon, startLngLat.tip);
  setMarker(endLngLat.point, end_icon, endLngLat.tip);

  // 司机或者其他标注点添加
  markers.forEach((item) => {
    setMarker(item.point, marker_icon, item.tip);
  });

//   监听底部信息盒子滚动
  addEventScroll()
}

// 监听底部信息盒子滚动结束事件
function addEventScroll() {
  let scrollTimeout;
  window.addEventListener("scroll", function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () {
      // 在滚动结束后重置地图渲染
      console.log("滚动结束,重新渲染地图");
    }, 500); // 设置延迟时间，单位为毫秒
  });
}

// 防抖函数
function debounce(fn, wait) {
  let timeout = null;
  return function () {
    let context = this;
    let args = arguments;
    if (timeout) clearTimeout(timeout);
    let callNow = !timeout;
    timeout = setTimeout(() => {
      timeout = null;
    }, wait);
    if (callNow) fn.apply(context, args);
  };
}

// 绘制路线规划
function setPath() {
  //调用导航路线api
  let driving = new AMap.Driving({
    map: map,
    showTraffic: false, //是否显示拥堵颜色
    autoFitView: true,
    hideMarkers: true,
  });

  // 根据起点终点规划路线,获取到路线之后,调用route函数重新自定义绘制
  driving.search(
    startLngLat.point,
    endLngLat.point,
    {
      //途经点参数，最多支持传入16个途经点
      waypoints,
    },
    function (status, result) {
      // result 即是对应的驾车导航信息，相关数据结构文档请参考  https://lbs.amap.com/api/javascript-api/reference/route-search#m_DrivingResult
      if (status === "complete") {
        console.log("自定义重新绘制");
        route(result.routes[0]);
      } else {
        console.log("获取驾车数据失败：" + result);
      }
    }
  );

  // 根据起终点名称规划驾车导航路线
  function route(route) {
    const path = parseRouteToPath(route);
    routeLine_obj = new AMap.Polyline({
      map: map,
      path,
      zIndex: 999,
      ...PolylineOption,
    });
    routeLine_obj.setMap(map);
  }

  // 转换获取的path路线
  function parseRouteToPath(route) {
    const path = [];
    for (let i = 0, l = route.steps.length; i < l; i++) {
      const step = route.steps[i];
      for (let j = 0, n = step.path.length; j < n; j++) {
        path.push(step.path[j]);
      }
    }
    return path;
  }
}

/**
 * 添加标记点到地图，包括起始、终点、司机或者各种标记点都可以调用此函数
 * @param {*} position 标记点坐标 [104.061222, 30.620885]
 * @param {*} image 标记点图标路径
 * @param {*} tip 标记点旁边的弹窗信息,不传则代表没有弹窗信息
 */
function setMarker(position, image, tip) {
  // 图标和content无法共存，故单独渲染一次content弹窗信息
  if (tip.length > 0) {
    new AMap.Marker({
      map,
      position, //起点经纬度
      autoRotation: true,
      content:
        `<div class="dialogBox">` +
        tip
          .map((item) => {
            return `
              <div>
                <p class="title">${item.title}</p>
                <p class="content">${item.content}</p>  
              </div>
            `;
          })
          .join("") +
        `</div>`,
    });
  }
  return new AMap.Marker({
    map,
    position, //起点经纬度
    offset: new AMap.Pixel(-10, -20),
    icon: new AMap.Icon({
      size: new AMap.Size(iconSize, iconSize),
      image,
      imageSize: new AMap.Size(iconSize, iconSize),
      imageOffset: new AMap.Pixel(0, 0),
    }), //起点icon
    autoRotation: true,
  });
}
