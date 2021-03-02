# Leaflet Animated Marker
沿轨迹带方向的动态marker，查看 [在线示例](http://gisarmory.xyz/blog/index.html?demo=LeafletRouteAnimate)。

## 如何使用

参考如下代码，即可实现动态marker绘制，并动态绘制已行走轨迹

The following code will create an AnimatedMarker that moves along `line`, assuming a `Leaflet.Map` called `map`.

    var carIcon = L.icon({
        iconSize: [37, 26],
        iconAnchor: [19, 13],
        iconUrl: '../img/car.png'
    })
    // 动态marker
    var animatedMarker = L.animatedMarker(routeLine.getLatLngs(), {
        icon: carIcon,
        playCall: updateRealLine
    }).addTo(map)
    var newLatlngs = [routeLine.getLatLngs()[0]]
    
    // 绘制已行走轨迹线（橙色那条）
    function updateRealLine(latlng) {
        newLatlngs.push(latlng)
        realRouteLine.setLatLngs(newLatlngs)
    }



## 播放状态控制

    // 开始
    function startClick() {
        animatedMarker.start();
    }
    
    // 暂停
    function pauseClick() {
        animatedMarker.pause();
    }
    
    // 停止
    function stopClick() {
        newLatlngs = []
        animatedMarker.stop();
    }





## 参考链接

https://github.com/openplans/Leaflet.AnimatedMarker

https://github.com/mohsen1/leaflet-moving-marker