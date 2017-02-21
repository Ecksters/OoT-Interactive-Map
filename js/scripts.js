
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
    sceneLayer.remove();
    roomLayer.remove();
    if ( $('#enableRegions').is(':checked') ) {
      regionLayer = addOverlay(loadRegions(layerData[data.name]["id"], dataRegions));
      addLabel(regionLayer);
    }
    areaLayersData = loadAreas(layerData[data.name].folder);
    if ( $('#enableScenes').is(':checked') )
      sceneLayer = addOverlay(areaLayersData.sceneData);
    if ( $('#enableRooms').is(':checked') )
      roomLayer = addOverlay(areaLayersData.roomData);
    
    miniMap.changeLayer(new L.TileLayer('maps/' + layerData[data.name]["folder"] + '/{z}/map_tile_{x}_{y}.png', {minZoom: 8, maxZoom: 10, attribution: "minimap"}));
  }
 
  mapBounds = new L.LatLngBounds(map.unproject(defaultMap.southWest, 15), map.unproject(defaultMap.northEast, 15));
  
  map.setMaxBounds(mapBounds);
  
  
  var zoomHome = L.Control.zoomHome();
  zoomHome.addTo(map);
  var drawControl = new L.Control.Draw();
  map.addControl(drawControl);
  
  $('.tooltip').tooltipster({theme: ['tooltipster-shadow', 'tooltipster-shadow-customized'],
                              side: ['left', 'top', 'bottom', 'right'],
                              delay: 100
                              });
 //Fix odd scrollbar issue in tooltips
 $('#projectInfo').tooltipster('open');
 $('#projectInfo').tooltipster('close');
 var mapAdult = false;
 map.addLayer(layers.childAngledLayer);
 
 
  
 // L.control.layers(baseMaps, null, {collapsed: false}).addTo(map);
function changeAge() {    
    mapAdult = !mapAdult;
    // toggle the layer
    refreshMap();
}

function refreshMap() {
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

var regionLayerData = loadRegions(0, dataRegions);
var regionLayer = addOverlay(regionLayerData);
addLabel(regionLayer);

var areaLayersData = loadAreas(defaultMap.folder)
var sceneLayer = addOverlay(areaLayersData.sceneData);
var roomLayer = addOverlay(areaLayersData.roomData);

function loadAreas(mapName) {
  var sceneData = Array();
  var roomData = Array();
  var coords = mapName + "Coords";
  for(var i in mapData)
  {
    var currentScene = mapData[i];
    if(Array.isArray(currentScene[coords]))
    {
      for(var j in currentScene[coords]){
        currentSection = currentScene[coords][j];
        sceneData.push(
        {
             "type": "Feature", 
             "geometry": { 
               "type": "Polygon", 
               "coordinates": [currentSection]
             }, 
             "properties": { 
               "name": currentScene.name,
               "className": "scene"+currentScene.id+ " scene",
               "type": "scene",
               "id": currentScene.id
              } 
        });
      }
    }
    var rooms = currentScene.rooms;
    if(Array.isArray(rooms))
    {
      for(var j in rooms)
      {
        var currentRoom = rooms[j];
        if(Array.isArray(currentRoom[coords]))
        {
          for(var k in currentRoom[coords]){
            currentSection = currentRoom[coords][k];
            roomData.push(
            {
                 "type": "Feature", 
                 "geometry": { 
                   "type": "Polygon", 
                   "coordinates": [currentSection]
                 }, 
                 "properties": { 
                   "name": currentRoom.name,
                   "className": "room"+currentRoom.id+"s"+currentScene.id+" room",
                   "type": "room",
                   "scene": currentScene.id,
                   "id": currentRoom.id
                  } 
            });
          }
        }
      }
    }
  }
  return {sceneData, roomData};
}


function loadRegions(currentMap, data)
{
  var overlayData = Array();
  for(var i in data[currentMap])
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
             "className": "region"+i+" region",
             "type": "region",
             "id": i
             } 
      });
    }
  }
  return overlayData;
}

function addOverlay(overlayData)
{
  overlayLayer = L.geoJSON(overlayData, {
      style: function(feature) {
        return {
        "color": "transparent",
        "weight": 0,
        "fill": "transparent",
        "lineJoin":  'round',
        "fill-opacity": "0",
        "className": feature.properties.className
        };
      },
      onEachFeature: function (feature, layer) {
        layer.on('mouseout', function () {
            $('.'+feature.properties.className.split(" ")[0]).attr({"fill": "transparent", "fill-opacity": "0"});
        });
        layer.on('mouseover', function () {
          if(map.getZoom() < 14 || feature.properties.type != "region"){
            $('.'+feature.properties.className.split(" ")[0]).attr({"fill": "black", "fill-opacity": "0.2"});
          }
          var newView = "Hover Over an Area<br><br>";
          if(feature.properties.type == "scene")
          {
            var newView = "Scene " + feature.properties.id + ": " + feature.properties.name + "<br><br>";
          }
          else if(feature.properties.type == "room")
          {
            var newView = "Scene " + feature.properties.scene + ": " + mapData[feature.properties.scene].name + "<br>Room " + feature.properties.id + ": " + feature.properties.name;
          }
          $("#verboseOutputChanger").html(newView);
          fixSidebarHeight();
        });
        layer.on('mousedown', function () {
          if(map.getZoom() < 14 || feature.properties.type == "room")
          $('.'+feature.properties.className.split(" ")[0]).attr({"fill": "black", "fill-opacity": "0.6"});
        });
        layer.on('mouseup', function () {
          $('.'+feature.properties.className.split(" ")[0]).attr({"fill": "transparent", "fill-opacity": "0"});
        });
        layer.on('click', function () {
          $('.'+feature.properties.className.split(" ")[0]).attr({"fill": "transparent", "fill-opacity": "0"});
          map.fitBounds(layer.getBounds());
          if(feature.properties.type == "scene")
          {
            updateVerboseOutput(feature.properties.id, -1)
          }
          else if(feature.properties.type == "room")
          {
            updateVerboseOutput(feature.properties.scene, feature.properties.id)
          }
        });
      }
  }).addTo(map);
  return overlayLayer;
}

function addLabel(overlayLayer){
  overlayLayer.eachLayer(function(layer) {
    var bounds = layer.getBounds();
    var fontSize = (bounds._northEast.lng - bounds._southWest.lng) / map.getZoom() * 2500;
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


var romScene = 52;
var romRoom = -1;

var sceneVerboseSelect = new Array();
var roomVerboseSelect = new Array();
for(var i in mapData){
  sceneVerboseSelect.push({id: i, text: i + ": " + mapData[i].name});
}

for(var i in mapData[romScene].rooms) {
  roomVerboseSelect.push({id: i, text: i + ": " + mapData[romScene].rooms[i].name});
}

roomVerboseSelect.push({id: romRoom, text: romRoom + ": Scene Data"});
$('#verboseScene').select2({data: sceneVerboseSelect});
$('#verboseRoom').select2({data: roomVerboseSelect});

$('#verboseScene').val(romScene).trigger("change");
$('#verboseRoom').val(romRoom).trigger("change");
fetchROMDump("scenes/scene"+romScene);

$('#verboseScene').on("select2:select", function (e) {
  var foundLayer = false;
  sceneLayer.eachLayer(function(layer) {
    if(!foundLayer && e.params.data.id == layer.feature.properties.id)
    {
      map.fitBounds(layer.getBounds());
      foundLayer = true;
    }
  });
  updateVerboseOutput(e.params.data.id, -1)
});


$('#verboseRoom').on("select2:select", function (e) {
  var foundLayer = false;
  roomLayer.eachLayer(function(layer) {
    if(!foundLayer && romScene == layer.feature.properties.scene && e.params.data.id == layer.feature.properties.id)
    {
      map.fitBounds(layer.getBounds());
      foundLayer = true;
    }
  });
  updateVerboseOutput(romScene, e.params.data.id)
});

function updateVerboseOutput(scene, room)
{
  $('#verboseScene').val(scene).trigger("change");
  roomVerboseSelect = new Array();
  
  roomVerboseSelect.push({id: -1, text: -1 + ": Scene Data"});
  for(var i in mapData[scene].rooms) {
    roomVerboseSelect.push({id: i, text: i + ": " + mapData[scene].rooms[i].name});
  }
  $("#verboseRoom").select2('destroy').empty().select2({data: roomVerboseSelect});
  $('#verboseRoom').val(room).trigger("change");
  $("#verboseRoom input.select2-input").trigger("input");

  if(room == -1)
  {
    fetchROMDump("scenes/scene"+scene);
  }
  else
  {
    fetchROMDump("rooms/s"+scene+"r"+room);
  }
  fixSidebarHeight();
  
  romScene = scene;
  romRoom = room;
}

function fetchROMDump(name)
{
  jQuery.get('http://map.ecksters.com/data/'+name+'.txt', function(data) {
    $("#verboseOutput").html(data);
    $("#verboseOutput").scrollTop(0).scrollLeft(0);
  });
}

function fixSidebarHeight()
{
  var sidebarTextHeight = $('#dataUpperText').offset().top + $('#dataUpperText').outerHeight(true);
  var sidebarHeight = $('#sidebarContent').offset().top + $('#sidebarContent').outerHeight(true);
  
  $('#verboseOutput').css("height", sidebarHeight-sidebarTextHeight-20);
}

$(document).ready(function(){
  fixSidebarHeight();
});

$(window).resize(function() {
    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(function(){
        fixSidebarHeight();
    }, 50);
});

$('.settingsToggle').on('click', function(){refreshMap()});

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
    content : '<div id="ageToggleContainer"><img src="images/ageToggle.png"><div id="ageToggle"></div><div id="ageToggleSelection"></div></div>',
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
            $('#ageToggleSelection').animate({left: mapAdult*100+"px"}, 200)
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
    for(var i in coords[0])
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
  

  