
  var yx = L.latLng;

  var xy = function(x, y) {
      if (L.Util.isArray(x)) {    // When doing xy([x, y]);
          return yx(x[1], x[0]);
      }
      return yx(y, x);  // When doing xy(x, y);
  };
  

  var layers = {
    childLayer: L.tileLayer('maps/childangle/{z}/map_tile_{x}_{y}.png', {
      attribution: 'Child Isometric View',
    }),
    childTopLayer: L.tileLayer('maps/childtop/{z}/map_tile_{x}_{y}.png', {
      attribution: 'Child Top View',
    }),
    adultLayer: L.tileLayer('maps/adultangle/{z}/map_tile_{x}_{y}.png', {
      attribution: 'Adult Isometric View',
    }),
    adultTopLayer: L.tileLayer('maps/adulttop/{z}/map_tile_{x}_{y}.png', {
      attribution: 'Adult Top View',
    })
  };
  
  var layerData = {
  "Child Isometric View": {"id": 0, "southWest": [0, 11424], "northEast": [21393, 0], "folder": "childangle", "zoom": 11},
  "Child Top View": {"id": 1, "southWest": [0, 15600], "northEast": [20940, 0], "folder": "childtop", "zoom": 11},
  "Adult Isometric View": {"id": 2, "southWest": [0, 15000], "northEast": [25000, 0], "folder": "adultangle", "zoom": 11},
  "Adult Top View": {"id": 3, "southWest": [0, 22000], "northEast": [30000, 0], "folder": "adulttop", "zoom": 10},
  };
 
  
  
  var map = L.map('map', {
    crs: L.CRS.Simple,
    maxZoom: 15,
    minZoom: 11,
    noWrap: true,
    continuousWorld: true,
    drawControl: true,
    layers: [layers.childLayer]
  }).setView([15000,7500], 11);
  
  function updateView(data)
  {
    southWest = map.unproject(layerData[data.name]["southWest"], 15);
    northEast = map.unproject(layerData[data.name]["northEast"], 15);
    mapBounds = new L.LatLngBounds(southWest, northEast);
    map.setMaxBounds(mapBounds);
    map.setMinZoom(layerData[data.name]["zoom"]);
    map.setZoom(layerData[data.name]["zoom"]);
    sceneLayer.remove();
    loadScenes(layerData[data.name]["id"]);
    miniMap.changeLayer(new L.TileLayer('maps/' + layerData[data.name]["folder"] + '/{z}/map_tile_{x}_{y}.png', {minZoom: 8, maxZoom: 8, attribution: "minimap"}));
  }
  
  var southWest = map.unproject([-2100, 13500], 15);
  var northEast = map.unproject([23500, -2100], 15);
  mapBounds = new L.LatLngBounds(southWest, northEast);
 
 
 map.on('baselayerchange', updateView);
  
  var baseMaps = {
    "Child Isometric View": layers.childLayer,
    "Child Top View": layers.childTopLayer,
    "Adult Isometric View": layers.adultLayer,
    "Adult Top View": layers.adultTopLayer
    
};
  
 
  map.setMaxBounds(mapBounds);
  
  L.control.layers(baseMaps, null, {collapsed: false}).addTo(map);
  

  
function polygonArea(X, Y) 
{ 
  area = 0;         // Accumulates area in the loop
  j = X.length-1;  // The last vertex is the 'previous' one to the first

  for (i=0; i<X.length; i++)
    { area = area +  (X[j]+X[i]) * (Y[j]-Y[i]); 
      j = i;  //j is previous vertex to i
    }
  return Math.abs(area/2);
}

var myStyle = {
  "color": "#000000",
  "weight": 0,
  "fill": false
};
  
  
var layerData;

var sceneLayer;
loadFeatures(0, dataRegions, dataRegionNames);

function loadFeatures(currentMap, data, names)
{
  layerData = Array();
  for(i in data[currentMap])
  {
    var currentFeature = data[currentMap][i];
    console.log(currentFeature);
    if(Array.isArray(currentFeature.Outline))
    {
      /*var coordsX = new Array();
      var coordsY = new Array();
      for(j in scene.Outline[0])
      {
        coordsX.push(scene.Outline[0][j][0]);
        coordsY.push(scene.Outline[0][j][1]);
      }
      dataScenes[0][i].Area = polygonArea(coordsX, coordsY);*/
      layerData.push(
      {
           "type": "Feature", 
           "geometry": { 
             "type": "Polygon", 
             "coordinates": currentFeature.Outline
           }, 
           "properties": { 
             "name": names[currentFeature.id].Name
             } 
      });
    }
  }


   sceneLayer = L.geoJSON(layerData, {
      style: myStyle,
      onEachFeature: function (feature, layer) {
        layer.on('mouseover', function () {
          this.setStyle({
            'fill': true
          });
        });
        layer.on('mouseout', function () {
          this.setStyle({
            'fill': false
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
  
  sceneLayer.eachLayer(function(layer) {
    var bounds = layer.getBounds();
    var fontSize = (bounds._northEast.lng - bounds._southWest.lng) / map.getZoom() * 3000;
    if(fontSize > 8) {
      layer.bindTooltip("<span style='font-size: " + fontSize + "px'>" + layer.feature.properties.name + "</span>", {
        className: "label",
        permanent: true,
        direction: "center"
      }).openTooltip();
     }
  });
}


map.on("zoomend", function(e)
{
  sceneLayer.eachLayer(function(layer) {
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
  
  var sidebar = L.control.sidebar('sidebar').addTo(map);
  
  var osm2 = new L.TileLayer('maps/childangle/{z}/map_tile_{x}_{y}.png', {minZoom: 8, maxZoom: 8, attribution: "minimap"});
  var miniMap = new L.Control.MiniMap(osm2).addTo(map);
  
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
 console.log("[[" + coordsText + "]]");
  
  /*console.log( 
'  { "type": "Feature", \n' +
'         "geometry": { \n' +
'           "type": "' + layerType + '", \n' +
'           "coordinates": [[\n' +
'               ' + coordsText + ' \n' +
'             ]]\n' +
'         }, \n' +
'         "properties": { \n' +
'           "prop0": "value0", \n' +
'           "prop1": {"this": "that"} \n' +
'           } \n' +
'         }\n');*/
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
  

  