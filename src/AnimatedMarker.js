L.AnimatedMarker = L.Marker.extend({
  options: {
    // meters
    distance: 100,
    // ms
    interval: 100,
    // animate on add?
    autoStart: false,
    isPlay: undefined,
    playCall: null,
    pauseTime:null, // 暂停时间戳
    usedTime:0, // 画当前线段已用时间
  },

  initialize: function (latlngs, options) {
    this.isZooming = false;
    this.setLine(latlngs);
    L.Marker.prototype.initialize.call(this, latlngs[0], options);
    this.resetIcon(options.icon.options)
  },

  resetIcon: function (options) {
    const v = this
    var Icon = L.DivIcon.extend({
      createIcon: function () {
        // outerDiv.style.transform is updated by Leaflet
        var outerDiv = document.createElement('div');
        outerDiv.style.width = options.iconSize[0] + "px"
        outerDiv.style.height = options.iconSize[1] + "px"
        v.div = document.createElement('div');
        v.div.style.width = options.iconSize[0] + "px"
        v.div.style.height = options.iconSize[1] + "px"
        v.div.style.transition = 'transform linear 100ms'
        v.div.style.transformOrigin = 'center'
        v.div.style.transform = 'translate3d(-' + options.iconAnchor[0] + 'px, -' + options.iconAnchor[0] + 'px, 0) rotate(-' + v._latlngs[0].bearing + 'deg)';
        const img = document.createElement('img');
        img.src = options.iconUrl;
        img.width = options.iconSize[0];
        img.height = options.iconSize[1];
        v.div.appendChild(img);
        outerDiv.appendChild(v.div);
        return outerDiv;
      },
      rotate(deg) {
        if ((v.before && (Math.abs(v.before - deg) >= 180))) {
          v.div.style.transition = 'none'
        } else {
          v.div.style.transition = 'transform linear 100ms'
        }
        v.div.style.transform = 'translate3d(-19px, -13px, 0) rotate(-' + deg + 'deg)';
        v.before = deg
      },
      iconSize: options.iconSize,
    })
    this.icon = new Icon()
    this.setIcon(this.icon)
  },

  // Breaks the line up into tiny chunks (see options) ONLY if CSS3 animations
  // are not supported.
  _chunk: function (latlngs) {
    var i,
      len = latlngs.length,
      chunkedLatLngs = [];

    for (i = 1; i < len; i++) {
      var cur = latlngs[i - 1],
        next = latlngs[i],
        dist = cur.distanceTo(next),
        factor = this.options.distance / dist,
        dLat = factor * (next.lat - cur.lat),
        dLng = factor * (next.lng - cur.lng);

      if (dist > this.options.distance) {
        chunkedLatLngs.push(cur);
        while (dist > this.options.distance) {
          var bearing = cur.bearing
          var duration = cur.duration
          cur = new L.LatLng(cur.lat + dLat, cur.lng + dLng);
          cur.bearing = bearing
          cur.duration = duration
          dist = cur.distanceTo(next);
          chunkedLatLngs.push(cur);
        }
      } else {
        chunkedLatLngs.push(cur);
      }
    }
    chunkedLatLngs.push(latlngs[len - 1]);

    return chunkedLatLngs;
  },

  onAdd: function (map) {
    L.Marker.prototype.onAdd.call(this, map);
    this.animate()
    this.map = map;
    const _this = this
    map.addEventListener('zoomstart', function () {
      _this.isZooming = true;
    });
    map.addEventListener('zoomend', function () {
      _this.isZooming = false;
    });

    // Start animating when added to the map
    if (this.options.autoStart) {
      this.start();
    }
  },

  animate: function () {
    var now = Date.now();
    var end = this.startedAt + this.duration - this.usedTime;
    if (now < end) {
      if (this.isPlay) {
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this._i < (this._latlngs.length - 1)) {
      this.usedTime = 0;
      this.pauseTime = null;
      this.startedAt = Date.now();
      this.startLatLng = this._latlngs[this._i]
      this.nextLatLng = this._latlngs[this._i + 1]
      this.duration = this.startLatLng.duration
      this.setLatLng(this._latlngs[this._i]);
      this.icon.rotate(this.startLatLng.bearing);
      this._i++;
      if (this.isPlay) {
        requestAnimationFrame(this.animate.bind(this));
      }
    }

    // 解决地图缩放是图标会偏移轨迹线问题
    if (!this.isZooming && this.map) {
      var t = now - this.startedAt + this.usedTime;
      var lat = this.startLatLng.lat + ((this.nextLatLng.lat - this.startLatLng.lat) / this.startLatLng.duration * t);
      var lng = this.startLatLng.lng + ((this.nextLatLng.lng - this.startLatLng.lng) / this.startLatLng.duration * t);
      this.setLatLng({
        lat: lat,
        lng: lng
      });
      // 用于动态轨迹线展示
      if (this.options.playCall) {
        this.options.playCall({
          lat: lat,
          lng: lng
        })
      }
    }
  },
  // Start the animation
  start: function () {
    if(this.isPlay === false){
      // 若为暂停后重新开始,记录当前线段已用时间
      this.usedTime += this.pauseTime - this.startedAt;
      this.pauseTime = null;
    }
    this.startedAt = Date.now();
    this.isPlay = true
    this.animate()
  },

  pause: function () {
    this.pauseTime = Date.now();
    this.isPlay = false
  },
  // Stop the animation in place
  stop: function () {
    this.isPlay = undefined
    this.usedTime = 0
    this.startedAt = NaN
    this._i = 0
    this.animate();
  },

  setLine: function (latlngs) {
    for (var i = 0; i < latlngs.length; i++) {
      if (i === latlngs.length - 1) {
        latlngs[i].duration = latlngs[i - 1].duration
        latlngs[i].bearing = latlngs[i - 1].bearing
      } else {
        latlngs[i].duration = latlngs[i].distanceTo(latlngs[i + 1]) / this.options.distance * this.options.interval
        latlngs[i].bearing = this.getRotation(latlngs[i], latlngs[i + 1])
      }
    }
    this._latlngs = latlngs;
    // this._latlngs = this._chunk(latlngs);
    this._i = 0;
  },

  getRotation: function (start, end) {
    var dx = end.lng - start.lng;
    var dy = end.lat - start.lat;
    var radian = Math.atan2(dy, dx); //弧度值
    var rotation = 180 * radian / Math.PI //转换为角度值
    if (rotation > -180 && rotation < 0) {
      rotation = 360 + rotation;
    }
    return rotation
  }

});

L.animatedMarker = function (latlngs, options) {
  return new L.AnimatedMarker(latlngs, options);
};