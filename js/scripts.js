
  var yx = L.latLng;

  var xy = function(x, y) {
      if (L.Util.isArray(x)) {    // When doing xy([x, y]);
          return yx(x[1], x[0]);
      }
      return yx(y, x);  // When doing xy(x, y);
  };
  

  var layers = {
       childAngledLayer: L.tileLayer('maps/childAngled/{z}/map_tile_{x}_{y}.png', {
      attribution: 'Child Angled View',
    }),
       adultAngledLayer: L.tileLayer('maps/adultAngled/{z}/map_tile_{x}_{y}.png', {
      attribution: 'Adult Angled View',
    })
  };
  
  var layerData = {
  "Child Angled View": {"id": 0, "southWest": [-13000, 25000], "northEast": [40000, -8000], "folder": "childAngled", "zoom": 11},
  "Adult Angled View": {"id": 1, "southWest": [0, 15000], "northEast": [15000, 0], "folder": "adultAngled", "zoom": 11}
  };
  
  var defaultMap = layerData["Child Angled View"];
 
  
  var map = L.map('map', {
    crs: L.CRS.Simple,
    maxZoom: 15,
    zoom: 11,
    center: [-.23,.4],
    minZoom: defaultMap.zoom,
    noWrap: true,
    layers: [layers.childAngledLayer],
    attributionControl: false,
    zoomControl: false,
  });
 
  
  function updateView(data)
  {
    //southWest = map.unproject(layerData[data.name]["southWest"], 15);
    //northEast = map.unproject(layerData[data.name]["northEast"], 15);
    //mapBounds = new L.LatLngBounds(southWest, northEast);
    //map.setMaxBounds(mapBounds);
    map.setMinZoom(layerData[data.name]["zoom"]);
    regionLayer.remove();
    regionLayer = addOverlay(loadAreas(layerData[data.name]["id"], dataRegions));
    addLabel(regionLayer);
    miniMap.changeLayer(new L.TileLayer('maps/' + layerData[data.name]["folder"] + '/{z}/map_tile_{x}_{y}.png', {minZoom: 8, maxZoom: 10, attribution: "minimap"}));
  }
 
  mapBounds = new L.LatLngBounds(map.unproject(defaultMap.southWest, 15), map.unproject(defaultMap.northEast, 15));
  
  map.setMaxBounds(mapBounds);
  
  var hash = new L.Hash(map);
  var zoomHome = L.Control.zoomHome();
  zoomHome.addTo(map);
  var drawControl = new L.Control.Draw();
  map.addControl(drawControl);
 
 var mapAdult = false;
 map.addLayer(layers.childAngledLayer);
  
 // L.control.layers(baseMaps, null, {collapsed: false}).addTo(map);
function changeAge() {    
    mapAdult = !mapAdult;
    // toggle the layer
    if (mapAdult) {
        map.removeLayer(layers.childAngledLayer);
        map.addLayer(layers.adultAngledLayer);
        updateView({layer: layers.adultAngledLayer, name: "Adult Angled View"})
    } else {
        map.removeLayer(layers.adultAngledLayer);
        map.addLayer(layers.childAngledLayer);
        updateView({layer: layers.childAngledLayer, name: "Child Angled View"})
    }

}

var myStyle = {
  "color": "#000000",
  "weight": 0,
  "fill": false,
  "lineJoin":  'round'
};
  
var regionLayer = addOverlay(loadAreas(0, dataRegions));
addLabel(regionLayer);


function loadAreas(currentMap, data)
{
  var overlayData = Array();
  for(i in data[currentMap])
  {
    var currentFeature = data[currentMap][i];
    if(Array.isArray(currentFeature.Outline))
    {
      overlayData.push(
      {
           "type": "Feature", 
           "geometry": { 
             "type": "Polygon", 
             "coordinates": currentFeature.Outline
           }, 
           "properties": { 
             "name": currentFeature.Name,
             "scene": currentFeature.Scene,
             "room": currentFeature.Room,
             } 
      });
    }
  }
  return overlayData;
}

function addOverlay(overlayData)
{
  overlayLayer = L.geoJSON(overlayData, {
      style: myStyle,
      onEachFeature: function (feature, layer) {
        layer.on('mouseout', function () {
          this.setStyle({
            'fill': false
          });
        });
        layer.on('mouseover', function () {
          this.setStyle({
            'fill': true,
            'fillOpacity': 0.1
          });
        });
        layer.on('mousedown', function () {
          this.setStyle({
            'fill': true,
            'fillOpacity': 0.4
          });
        });
        layer.on('click', function () {
          this.setStyle({
            'fill': false
          });
          map.fitBounds(layer.getBounds());
        });
      }
  }).addTo(map);
  return overlayLayer;
}

function addLabel(overlayLayer){
  overlayLayer.eachLayer(function(layer) {
    var bounds = layer.getBounds();
    var fontSize = (bounds._northEast.lng - bounds._southWest.lng) / map.getZoom() * 3000;
    if(fontSize > 2) {
      layer.bindTooltip("<span style='font-size: " + fontSize + "px'>" + layer.feature.properties.name + "</span>", {
        className: "label",
        permanent: true,
        direction: "center"
      });
      if(map.getZoom() > 12)
      {
        layer.closeTooltip();
      }
     }
  });
}

map.on("zoomend", function(e)
{
  regionLayer.eachLayer(function(layer) {
    if(typeof layer.getTooltip() != "undefined")
    {
      if(map.getZoom() < 13){
        layer.openTooltip();
      }
      else {
        layer.closeTooltip();
      }
    }
  });
});
  
  var sidebar = L.control.sidebar('sidebar', {position: 'right'}).addTo(map);
  
  var osm2 = new L.TileLayer('maps/' + defaultMap.folder + '/{z}/map_tile_{x}_{y}.png', {minZoom: 8, maxZoom: 10, attribution: "minimap"});
  var miniMap = new L.Control.MiniMap(osm2, {position: 'bottomleft', width: 200}).addTo(map);
  
  
L.control.custom({
    position: 'bottomleft',
    content : '<div id="ageToggleContainer"><img src="images/ageToggle.png"><div id="ageToggle"></div></div>',
    classes : '',
    style   :
    {
        margin: '10px',
        padding: '0px 0 0 0',
        cursor: 'pointer',
    },
    datas   :
    {
        'foo': 'bar',
    },
    events:
    {
        click: function(data)
        {
            changeAge();
            $('#ageToggle').animate({left: !mapAdult*100+"px"}, 200)
        }
    }
})
.addTo(map);

map.on('draw:created', function(e) {

  var layerType = getLayerType(e.layer);
  var coords;
  var coordsText = "";
  if(layerType == "Marker")
  {
    coords = e.layer.getLatLng();
    coordsText = "[" + coords.lat + ", " + coords.lng + "]";
  }
  else
  {
    coords = e.layer.getLatLngs();
    for(i in coords[0])
    {
      coordsText = coordsText + "[" + coords[0][i].lng + ", " + coords[0][i].lat + "], ";
    }
    coordsText = coordsText.substring(0, coordsText.length - 2);
  }
  window.prompt("Copy to clipboard: Ctrl+C, Enter", "[[" + coordsText + "]]");
});
  
  function getLayerType(layer) {

    if (layer instanceof L.Circle) {
        return 'Circle';
    }

    if (layer instanceof L.Marker) {
        return 'Marker';
    }

    if ((layer instanceof L.Polyline) && ! (layer instanceof L.Polygon)) {
        return 'Polyline';
    }

    if ((layer instanceof L.Polygon) && ! (layer instanceof L.Rectangle)) {
        return 'Polygon';
    }

    if (layer instanceof L.Rectangle) {
        return 'Rectangle';
    }

};
  

  