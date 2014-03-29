var IDX_TIMESTAMP = 0;
var IDX_LATITUDE  = 1;
var IDX_LONGITUDE = 2;
var IDX_HEADING   = 8;

var ViewIcon = L.icon({
    iconUrl: 'marker-icon-2x.png',
    iconRetinaUrl: 'marker-icon-2x.png',
    iconSize: [82, 82],
    iconAnchor: [42, 76],
    popupAnchor: [-3, -76],
});

var map,
    video,
    videoTrack,
    videoTrackFirstTimeStamp,
    videoTrackLastTimeStamp,
    videoTrackDuration,
    videoTrackMarker;

$(function() {
  video = $('#video').get(0);

  map = L.mapbox.map('map', 'spatialnetworks.map-xkumo5oi').setView([27.937545,-82.728939], 18);

  $.getJSON('video.json', function(data) {
    videoTrack = data;

    makeGeoJSONLineString(data);

    videoTrackFirstTimeStamp = data[0][IDX_TIMESTAMP];
    videoTrackLastTimeStamp  = data[data.length - 1][IDX_TIMESTAMP];
    videoTrackDuration       = (videoTrackLastTimeStamp - videoTrackFirstTimeStamp);

    var initialLocation = [ videoTrack[0][IDX_LATITUDE],
                            videoTrack[0][IDX_LONGITUDE] ];

    videoTrackMarker = L.marker(initialLocation, { icon: ViewIcon }).addTo(map);
    videoTrackMarker.setIconAngle(videoTrack[0][IDX_HEADING] + 90);

    map.setView(initialLocation, 18)
  });

  setupVideoEvents(video);
});

function makeGeoJSONLineString(samples) {
  var feature = { type: 'Feature',
                  properties: {},
                  geometry: { type: 'LineString',
                              coordinates: [] } };

  samples.forEach(function(sample) {
    feature.geometry.coordinates.push([sample[IDX_LONGITUDE], sample[IDX_LATITUDE]]);
  });

  L.geoJson(feature).addTo(map);
}

function setupVideoEvents(video) {
  video.onprogress = function(e) {
    var lastPoint = findPreviousTrackPoint(video.currentTime);
    var nextPoint = findNextTrackPoint(video.currentTime);

    var lastTimeStamp = lastPoint[IDX_TIMESTAMP];
    var nextTimeStamp = nextPoint[IDX_TIMESTAMP];

    var range = nextTimeStamp - lastTimeStamp;

    var percentage = ((video.currentTime * 1000.0) - lastTimeStamp) / range;

    var lastLocation = [lastPoint[IDX_LATITUDE], lastPoint[IDX_LONGITUDE]];
    var nextLocation = [nextPoint[IDX_LATITUDE], nextPoint[IDX_LONGITUDE]];

    var lon = ((nextLocation[1] - lastLocation[1]) * percentage) + lastLocation[1];
    var lat = ((nextLocation[0] - lastLocation[0]) * percentage) + lastLocation[0];

    var location = [ lat, lon ];

    var heading = ((nextPoint[IDX_HEADING] - lastPoint[IDX_HEADING]) * percentage) + lastPoint[IDX_HEADING];

    videoTrackMarker.setLatLng(location);
    videoTrackMarker.setIconAngle(heading + 90);
  }
}

function findPreviousTrackPointIndex(videoTime) {
  for (var i = 0; i < videoTrack.length; ++i) {
    var timeStamp = videoTrack[i][IDX_TIMESTAMP];
    if (timeStamp > videoTime * 1000.0) {
      return Math.max(0, i - 1);
    }
  }
  return 0;
}

function findPreviousTrackPoint(videoTime) {
  var index = findPreviousTrackPointIndex(videoTime);
  return videoTrack[index];
}

function findNextTrackPoint(videoTime) {
  var index = findPreviousTrackPointIndex(videoTime) + 1;
  return index < videoTrack.length ? videoTrack[index] : videoTrack[videoTrack.length - 1];
}
