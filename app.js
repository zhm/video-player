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
    var trackPoint = findNearestTrackPoint(video.currentTime);

    var location = [trackPoint[IDX_LATITUDE], trackPoint[IDX_LONGITUDE]];

    videoTrackMarker.setLatLng(location);
    videoTrackMarker.setIconAngle(trackPoint[IDX_HEADING] + 90);
  }
}

function findNearestTrackIndex(videoTime) {
  return Math.floor(((videoTime * 1000.0) / videoTrackDuration) * videoTrack.length);
}

function findNearestTrackPoint(videoTime) {
  return videoTrack[findNearestTrackIndex(videoTime)];
}
