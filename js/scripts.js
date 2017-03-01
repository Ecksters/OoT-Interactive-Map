////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//**************************************************************************************************************************************************************
// Map Controls and Basic Initialization
//**************************************************************************************************************************************************************
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
var layers = {
     childAngledLayer: L.tileLayer('maps/childAngled/{z}/map_tile_{x}_{y}.png', {
    attribution: 'Child Angled View',
  }),
     adultAngledLayer: L.tileLayer('maps/adultAngled/{z}/map_tile_{x}_{y}.png', {
    attribution: 'Adult Angled View',
  })
};

var actorTypes = ['enemy', 'nature'];
var plurals = {"enemy": "Enemies", "nature": "Flora or Rocks"};
  
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
 
var mapBounds = new L.LatLngBounds(map.unproject(defaultMap.southWest, 15), map.unproject(defaultMap.northEast, 15));

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
 
function changeAge() { //Swap age map out
    mapAdult = !mapAdult;
    // toggle the layer
    refreshMap();
}

$('div.sidebar-tabs > ul > li').on('click', function(e){controlSwap(e)});

function controlSwap(newTab) { //Logic for when user swaps between tabs on the sidebar
  if($(newTab.currentTarget).hasClass("active"))
  {
    var tab = newTab.currentTarget.id.slice(0, -3);
    switch(tab){
    case 'data':
        $('#' + tab + 'UpperText').append($('#locationChangerContainer'));
      break;
    case 'nature':
        $('#natureContextual').prepend($('#locationChangerContainer'));
      break;
    case 'enemy':
        $('#enemyContextual').prepend($('#locationChangerContainer'));
      break;
    }
    fixSidebarHeight();
  }
}


function updateView(data) { //Load map layers whenever a new map is selected(Angle, Age changes)
  map.setMinZoom(layerData[data.name]["zoom"]);
  regionLayer.remove();
  sceneLayer.remove();
  roomLayer.remove();
//  enemiesLayer[0].remove(); Not removing enemies layer for now, until Top-Down view is added, it lags if Show All is selected
//  enemiesLayer[1].remove(); Will add logic to check map angle changes for this later

  regionLayer = addOverlay(loadRegions(0, dataRegions)); //Old Region Code, layerData[data.name]["id"], saved for when we add top
  addLabel(regionLayer);
  areaLayersData = loadAreas(layerData[data.name].folder);
  sceneLayer = addOverlay(areaLayersData.sceneData);
  roomLayer = addOverlay(areaLayersData.roomData);
//  enemiesLayer = addIconOverlay(loadEnemies());
//  $('#enemyFilter').trigger('change');
  
  updateZoom();
  
  miniMap.changeLayer(new L.TileLayer('maps/' + layerData[data.name]["folder"] + '/{z}/map_tile_{x}_{y}.png', {minZoom: 8, maxZoom: 10, attribution: "minimap"}));
}

function refreshMap() { //Reloads the map, properly selecting Child/Adult
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

$(window).resize(function() { //Function calls whenever the user resizes their window
    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(function(){
        fixSidebarHeight();
    }, 50);
});

function fixSidebarHeight() { //Fixed to heights of utilities so that the sidebar doesn't have a scrollbar(unless on tiny screens), fixes were hard/impossible to implement in CSS
  var sidebarHeight = $('#sidebarContent').outerHeight(true);
  
  var dataTextHeight = $('#dataTabUpperText').outerHeight(true);

  var locationChangerHeight = $('#locationChangerContainer').outerHeight(true);
  
  var enemyTextHeight = $('#enemyTabUpperText').outerHeight(true);
  var enemySearchHeight = $('#enemyFilterContainer').outerHeight(true);
  
  var natureTextHeight = $('#natureTabUpperText').outerHeight(true);
  var natureSearchHeight = $('#natureFilterContainer').outerHeight(true);
  
  $('#verboseOutput').css("height", sidebarHeight-dataTextHeight-20);
  
  $('#enemyTableContainer').css("height", sidebarHeight-(enemyTextHeight+locationChangerHeight)-50);
  $('#enemySearchContainer').css("height", sidebarHeight-(enemyTextHeight+enemySearchHeight)-50);
  
  $('#natureTableContainer').css("height", sidebarHeight-(natureTextHeight+locationChangerHeight)-50);
  $('#natureSearchContainer').css("height", sidebarHeight-(natureTextHeight+natureSearchHeight)-50);
}

$('.settingsToggle').on('change', function(){updateZoom()});

map.on("zoomend", function(e){updateZoom()});

function updateZoom() { // All checks that occur each time the viewer zooms in/out, decides when to hide layers, change settings, etc.
  if ($('#enableRegions').is(':checked') ){
    $('.region').show();
    if(map.getZoom() < 13){
      $('.leaflet-tooltip.label').css('visibility', 'visible');
    }
    else{
      $('.leaflet-tooltip.label').css('visibility', 'hidden');
    }
  }
  else{
    $('.region').hide();
    $('.leaflet-tooltip.label').css('visibility', 'hidden');
  }
  //Scene Settings
  if ( $('#enableScenes').is(':checked') ){
    $('.scene').show();
  }
  else{
    $('.scene').hide();
  }
  //Room Settings
  if ( $('#enableRooms').is(':checked') ) {
    $('.room').show();
  }
  else {
    $('.room').hide();
  }
  //Actor Markers Showing as Grouped by Scene or By Room at Various Zooms
  if(map.getZoom() < 13){
    $('.sceneContainer').show();
    $('.roomContainer').hide();
  }
  else {
    $('.sceneContainer').hide();
    $('.roomContainer').show();
  }
}
  
var sidebar = L.control.sidebar('sidebar', {position: 'right'}).addTo(map);

var miniMapTiles = new L.TileLayer('maps/' + defaultMap.folder + '/{z}/map_tile_{x}_{y}.png', {minZoom: 8, maxZoom: 10, attribution: "minimap"});
var miniMap = new L.Control.MiniMap(miniMapTiles, {position: 'bottomleft', width: 200}).addTo(map);
  
  
L.control.custom({ //Initialize Link Age Switcher
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
}).addTo(map);

map.on('draw:created', function(e) { //Returns coordinates for shape/object creates, only works for Polygons/Rectangles and Markers, temporary for database creation
  var layerType = e.layer instanceof L.Marker;
  var coords;
  var coordsText = "";
  if(layerType)
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


$(document).ready(function(){
  for(var i in actorTypes) {
    initializeSearchInterface(actorTypes[i]);
    initializeSubtab(actorTypes[i]);
    $('#' + actorTypes[i] + 'SearchTab').tooltipster({trigger: 'custom'});
    fetchActors(romScene, romRoom, actorTypes[i]);
    searchActors(actorTypes[i]);
  }
  fixSidebarHeight();
});

function initializeSubtab(type) {
  $('ul#' + type + '-tabs li').click(function(){
      var tab_id = $(this).attr('data-tab');
      $('ul#' + type + '-tabs li').removeClass('current');
      $('.' + type + '-tab-content').removeClass('current');

      $(this).addClass('current');
      $("#"+tab_id).addClass('current');
      fixSidebarHeight();
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//**************************************************************************************************************************************************************
// Map Layer creation, add everything that's on the map itself
//**************************************************************************************************************************************************************
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var regionLayerData = loadRegions(0, dataRegions);
var regionLayer = addOverlay(regionLayerData);
addLabel(regionLayer);

var areaLayersData = loadAreas(defaultMap.folder)
var sceneLayer = addOverlay(areaLayersData.sceneData);
var roomLayer = addOverlay(areaLayersData.roomData);
var enemiesLayer = addIconOverlay(loadThumbnailContainers(), "enemy");

function loadAreas(mapName) { //Loads Rooms and Scenes onto the map with their respective data
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


function loadRegions(currentMap, data) //Loads overall Regions(think original map images) onto the map
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

function loadThumbnailContainers() { //Finds center of each room/scene and adds a container for thumbnails of each actor in that room/scene

  var roomIconContainers = Array();
  roomLayer.eachLayer(function (room){
    var coords = room.getBounds().getCenter()
    if(typeof mapData[room.feature.properties.scene].rooms[room.feature.properties.id].enemy != 'undefined' || typeof mapData[room.feature.properties.scene].rooms[room.feature.properties.id].nature != 'undefined')
    roomIconContainers.push(
    {
         "type": "Feature", 
         "geometry": { 
           "type": "Point", 
           "coordinates": [coords.lng, coords.lat]
         }, 
         "properties": { 
           "room": room.feature.properties.id,
           "class": "roomContainer markerContainer markers" + room.feature.properties.scene + "r" + room.feature.properties.id,
           "type": "roomContainer",
           "scene": room.feature.properties.scene,
           "enemy": mapData[room.feature.properties.scene].rooms[room.feature.properties.id].enemyCounts,
           "nature": mapData[room.feature.properties.scene].rooms[room.feature.properties.id].natureCounts
           }
    });
  });
  var sceneIconContainers = Array();
  sceneLayer.eachLayer(function (scene){
    var coords = scene.getBounds().getCenter();
    if((typeof mapData[scene.feature.properties.id].enemyCounts != 'undefined'  || typeof mapData[scene.feature.properties.id].natureCounts != 'undefined') && scene.feature.properties.id != 62) //Only push rooms with enemies, and NOT grotto scene
    sceneIconContainers.push(
    {
         "type": "Feature", 
         "geometry": { 
           "type": "Point", 
           "coordinates": [coords.lng, coords.lat]
         }, 
         "properties": { 
           "room": -1,
           "class": "sceneContainer markerContainer markers" + scene.feature.properties.id,
           "type": "sceneContainer",
           "scene": scene.feature.properties.id,
           "enemy": mapData[scene.feature.properties.id].enemyCounts,
           "nature": mapData[scene.feature.properties.id].natureCounts
           }
    });
  });
  
  return {rooms: roomIconContainers, scenes: sceneIconContainers};
}

function getIconImages(searchables, type) { //Gets image files and generates their HTML for array of actors passed
  var images = "";
  for(i in searchables)
  {
    var searchableName = dataTable[type][searchables[i].id].name.replace(/ |-|\'/gi, "")
    images += "<img class='actorIcon " + type + "Icon " + type + "Icon" + searchables[i].id + "' src='images/" + type + "Icons/" + searchableName + ".png' />";
  }
  return images;
}

function addIconOverlay(iconContainers) { //Adds icons to the map(all of them, of any type) for later usage and filtering
  var overlayLayers = Array();
  console.log(iconContainers);
  for(var i in iconContainers) {
    overlayLayers.push(L.geoJSON(iconContainers[i], {
      pointToLayer: function(feature, latlng) {
          var iconImages = "";
          for(var j in actorTypes) {
            iconImages += getIconImages(feature.properties[actorTypes[j]], actorTypes[j]);
          }
          return L.marker(latlng, {
            icon: new L.divIcon({className: feature.properties.class,
            iconSize: null,
            html: iconImages
            }),
            class: feature.properties.className,
          });
        }
      }).addTo(map));
  }
  return overlayLayers;
}

function addOverlay(overlayData) { //Add Region/Scene/Room dark clickable overlays
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
          $("#locationChangerPreview").html(newView);
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
            updateLocationChanger(feature.properties.id, -1)
          }
          else if(feature.properties.type == "room")
          {
            updateLocationChanger(feature.properties.scene, feature.properties.id)
          }
        });
      }
  }).addTo(map);
  return overlayLayer;
}

function addLabel(overlayLayer) { //Adds text labels to map for Region names
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//**************************************************************************************************************************************************************
// Scene/Room Selection Interface
//**************************************************************************************************************************************************************
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var romScene = 52;
var romRoom = -1;

var sceneLocationChangerSelect = new Array();
var roomLocationChangerSelect = new Array();
for(var i in mapData){
  sceneLocationChangerSelect.push({id: i, text: i + ": " + mapData[i].name});
}

for(var i in mapData[romScene].rooms) {
  roomLocationChangerSelect.push({id: i, text: i + ": " + mapData[romScene].rooms[i].name});
}

roomLocationChangerSelect.push({id: romRoom, text: romRoom + ": Scene Data"});
$('#locationChangerScene').select2({data: sceneLocationChangerSelect});
$('#locationChangerRoom').select2({data: roomLocationChangerSelect});

$('#locationChangerScene').val(romScene).trigger("change");
$('#locationChangerRoom').val(romRoom).trigger("change");
fetchROMDump("scenes/scene"+romScene);

$('#locationChangerScene').on("select2:select", function (e) {
  var foundLayer = false;
  sceneLayer.eachLayer(function(layer) {
    if(!foundLayer && e.params.data.id == layer.feature.properties.id)
    {
      map.fitBounds(layer.getBounds());
      foundLayer = true;
    }
  });
  updateLocationChanger(e.params.data.id, -1)
});


$('#locationChangerRoom').on("select2:select", function (e) {
  var foundLayer = false;
  roomLayer.eachLayer(function(layer) {
    if(!foundLayer && romScene == layer.feature.properties.scene && e.params.data.id == layer.feature.properties.id)
    {
      map.fitBounds(layer.getBounds());
      foundLayer = true;
    }
  });
  updateLocationChanger(romScene, e.params.data.id)
});

function updateLocationChanger(scene, room) { //Calls all necessary functions for updating contextual interfaces, which change when the room/scene changes
  romScene = scene;
  romRoom = room;
  $('#locationChangerScene').val(scene).trigger("change");
  roomLocationChangerSelect = new Array();
  
  roomLocationChangerSelect.push({id: -1, text: -1 + ": Scene Data"});
  for(var i in mapData[scene].rooms) {
    roomLocationChangerSelect.push({id: i, text: i + ": " + mapData[scene].rooms[i].name});
  }
  $("#locationChangerRoom").select2('destroy').empty().select2({data: roomLocationChangerSelect});
  $('#locationChangerRoom').val(room).trigger("change");
  $("#locationChangerRoom input.select2-input").trigger("input");

  if(room == -1)
  {
    fetchROMDump("scenes/scene"+scene);
  }
  else
  {
    fetchROMDump("rooms/s"+scene+"r"+room);
  }
  fetchActors(scene, room, "enemy");
  fetchActors(scene, room, "nature");
  fixSidebarHeight();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//**************************************************************************************************************************************************************
// ROM Data Output Tab Functionalities
//**************************************************************************************************************************************************************
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function fetchROMDump(name) { //Fetches and updates the ROM Dump output with the Verbose Ocarina output stored in the data text files
  jQuery.get('http://map.ecksters.com/data/'+name+'.txt', function(data) {
    $("#verboseOutput").html(data);
    $("#verboseOutput").scrollTop(0).scrollLeft(0);
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//**************************************************************************************************************************************************************
// Enemies Tab Functionalities
//**************************************************************************************************************************************************************
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Location Enemies Interface and Functionalities
////////////////////////////////////////////////////////////////////////////////

function fetchActors(scene, room, type) { //Finds and lists actors in the currently viewed scene/room
  var roomActors = new Array();
  var table = $("#" + type + "Table");

  
  if(room == "-1") {
    $("#" + type + "Table").html("<tr><th>No " + plurals[type] + " Exist on the Scene Level</th></tr>");
    return 0;
  }
  else {
    roomActors = mapData[scene].rooms[room][type];
  }
  if(typeof roomActors == "undefined") {
    $("#" + type + "Table").html("<tr><th>No " + plurals[type] + " Found in Room Selected</th></tr>");
    return 0;
  }
  
  var currentSetup = -1;
  $("." + type + "Row").tooltipster('destroy');
  table.html("<tr><th>Name</th><th>Details</th><th>Search</th></tr>");
  var tableData = [];
  for(i in roomActors) {
    var actor = roomActors[i];
    if(actor.setup != currentSetup) {
      var setupName = "";
      currentSetup = actor.setup;
      for (var i in mapData[romScene].setups) {
        if(mapData[romScene].setups[i].id == currentSetup && mapData[romScene].setups[i].name != "") {
          setupName = " - " + mapData[romScene].setups[i].name;
        }
      }
      tableData.push("<tr><td colspan='3' class='actorSetupSplit'>Scene Setup: " + currentSetup + setupName + "</td></tr>");
    }
    var newRow = createTableRow(actor, type);
    tableData.push(newRow);
    table.scrollTop(0).scrollLeft(0);
    //fa fa-window-maximize (Might later add a way to view the data all together in a larger window)
  }
  table.append(tableData);
}

////////////////////////////////////////////////////////////////////////////////
// Actor Search Interface and Functionalities
////////////////////////////////////////////////////////////////////////////////

function initializeSearchInterface(type) { //Creates handlers and fills dropdowns for Search Interfaces
  var select = new Array();
  var selectAll = new Array();
  for(var i in dataTable[type]) {
    select.push({id: i, text: dataTable[type][i].actor + ": " + dataTable[type][i].name});
    selectAll.push(i);
  }

  $('#' + type + 'Filter').select2({data: select,
                             placeholder: "Select Enemies",
                             closeOnSelect:false});

  $('#' + type + 'Filter').on("change", function (e) {
    $('.' + type + 'Icon').hide();
    var selected = $('#' + type + 'Filter').select2("data");
    var shown = "";
    for(i in selected) {
      shown += '.' + type + 'Icon' + selected[i].id + ',';
    }
    $(shown.slice(0,-1)).show();
    $('#enableRegions').attr('checked', false).trigger('change');
    searchActors(type);
  });

  $('#' + type + 'ShowAll').on('click', function(){$('select#' + type + 'Filter').val(selectAll).trigger('change');});
  $('#' + type + 'HideAll').on('click', function(){
    $('select#' + type + 'Filter option').attr('selected', false);
    $('select#' + type + 'Filter').val(null).trigger('change');
  });


  $('#' + type + 'HighlightAll').on('click', function(){
    highlightActors();
  });

}

var currentlyHighlighting = false;
function highlightActors(type){ //Puts an alternating glow/shadow on all visible actor icons for 8 seconds
    if(currentlyHighlighting == false)
  {
    currentlyHighlighting = true;
    $('.' + type + 'Icon').addClass('glow');
    setTimeout(function(){
      $('.' + type + 'Icon').removeClass('glow');
      currentlyHighlighting = false;
    }, 8000);
  }
}

function searchActors(type) { //Finds and updates table and map icons with actors in current filter
  var table = $("#" + type + "SearchTable");
  if($("#" + type + "Filter").select2("data").length === 0){
    table.html("<tr><th>No " + plurals[type] + " Selected</th></tr>");
    return 0;
  }
  
  searchResults = filterCurrentActors(type);
  var currentScene = -1;
  var currentSetup = -1;
  var currentRoom = -1;
  $("." + type + "SearchRow").tooltipster('destroy');
  table.html("<tr><th>Name</th><th>Details</th><th>Zoom</th></tr>");
  var tableData = [];
  for(i in searchResults) {
    var actor = searchResults[i];
    if(actor.scene != currentScene || actor.setup != currentSetup)
    {
      var setupName = "";
      currentScene = actor.scene;
      currentSetup = actor.setup;
      for (var i in mapData[currentScene].setups) {
        if (mapData[currentScene].setups[i].id == currentSetup){
          if(mapData[currentScene].setups[i].name != ""){
            setupName = " (" + mapData[currentScene].setups[i].name + ")";
          }
        }
      }
      tableData.push("<tr><td colspan='3' class='actorSetupSplit'>Scene: " + currentScene + " (" + mapData[currentScene].name + "), Setup: " + currentSetup + setupName + "</td></tr>");
    }
    var newRow = createTableRow(actor, type);
    tableData.push(newRow);
    table.scrollTop(0).scrollLeft(0);
    //fa fa-window-maximize (Might later add a way to view the data all together in a larger window)
  }
  table.append(tableData);
}

function filterCurrentActors(type) { //Finds actorss that match the current filter in the actor search bar, returns array of their IDs
  var currentSelection = $("#" + type + "Filter").select2("data");
  var currentFilter = new Array();
  var actorsFound = new Array();
  
  for(var i in currentSelection){
    currentFilter.push(parseInt(currentSelection[i].id));
  }
  for(var i in searchables[ type]){
    if($.inArray(searchables[type][i].id, currentFilter) !== -1){
      actorsFound.push(searchables[type][i]);
    }
  }
  return actorsFound;
}


////////////////////////////////////////////////////////////////////////////////
// Creation of Rows and their functionalities in Actor Tables
////////////////////////////////////////////////////////////////////////////////

function createTableRow(actor, type) { //Generates a row for Location tables, passed a fresh object
  var locationData = "";
  var rowType = type + "Row";
  var lookType = "Search";
  var lookFunction = setSearch;
  var checkIcon = "binoculars";
  if(typeof actor.scene != 'undefined') { //Swap variables over if the row is on the Search page
    locationData = "' data-scene='" + actor.scene + "' data-room='" + actor.room;
    rowType= type + "SearchRow";
    lookType = "Zoom";
    lookFunction = setZoom;
    checkIcon = "search-plus";
  }
  
  actor.position = actor.x + "," + actor.y + "," + actor.z;
  actor.rotation = actor['x-rotation'] + "," + actor['y-rotation'] + "," + actor['z-rotation'];
  
  if(type == "enemy"){
    actor.drop = dataTable[type][actor.id].drop;
  }
  else {
    if(typeof actor.data == "undefined" || typeof actor.data.drop == "undefined" || actor.data.drop === false){
      actor.drop = "None";
    }
    else if(actor.data.drop != false){
      actor.drop = actor.data.drop;
    }
  }
  var newRow = $("<tr class='" + rowType + "' data-id='" + actor.id + 
    locationData + "' data-parameters='" + actor.parameters + "' data-setup='" + actor.setup + "' data-drop='" + actor.drop + 
    "' data-position='"  + actor.position +  "' data-rotation='"  + actor.rotation + "'><td><div>" + 
    dataTable[type][actor.id].name + "</div></td><td class='" + type + "Details actorDetails'><i class='fa fa-book " + type + "Details actorDetails'></i></td><td class='" + 
    type + lookType + " actor" + lookType + "'><i class='fa fa-" + checkIcon + "'></i></td></tr>");
  
  newRow.find('td.' + type + 'Details').on('click', function(e){
    updateModalActor($(this), type);
    $('#openModal').modal();
  });
  newRow.find('td.' + type + lookType).on('click', function(e){
    lookFunction($(this), type);
  });
  createRowTooltip(newRow, actor, type);
  return newRow;
}

function rowDataTable(actor, type) { //Creates the table used in the row tooltips, passed an actor and its type
  return "<table><tr><th>Actor</th><th>Parameters</th><th>Drop Table</th><th>Position</th><th>Rotation</th></tr>" +
         "<tr><td>" + dataTable[type][actor.id].actor + "</td><td>" + actor.parameters + "</td><td>" +
          actor.drop + "</td><td>(" +  actor.position + ")</td><td>(" + actor.rotation + ")</td></tr></table>";
}

function createRowTooltip(newRow, actor, type) { //Generates the tooltip placed on an actor row, must have updated the modal before calling with function rowDataTable, passed the row to add Tooltipster to
    newRow.tooltipster({
    theme: ['tooltipster-shadow', 'tooltipster-shadow-customized'],
    delay: [200,300],
    trigger: 'custom',
    content: $(rowDataTable(actor, type)),
    triggerOpen: {
        mouseenter: true,
        touchstart: true
    },
    triggerClose: {
        mouseleave: true,
        touchleave: true
    },
    interactive: true,
    contentCloning: true,
    side: ['left', 'top', 'bottom', 'right']});
}

function updateModalActor(actor, type) { // Updates the popup with actor details and generates the visual Drop Table, passed "Details" button that was clicked
  var actorData = actor.parent().data();
  var drop = "None";
  var dropTable = "";
  var actorDrop = actorData.drop;
  if(actorDrop === ""){
    actorDrop = dataTable[type][actorData.id].drop
  }
  if(actorDrop !== '' && actorDrop != 'None' && actorDrop !== false){
    drop = "Table " + actorDrop;
    table = dropTables[actorDrop].table;
    dropTable = "<div class='dropTable'>";
    for(var i in table){
      if(table[i] > 0){
        dropTable += "<div class='dropTableSlot' style='background: " + dropTableColors[i].color + "; width: " + table[i]*5.55 + "%;'><div class='fractionTop'>" + table[i] + 
                      "</div><div class='fractionBottom'>16</div><img class='dropImage' src='images/drops/drop" + i + ".png' />​</div>";
      }
    }
    dropTable += "</div>"
  }
  $('#infoPopup').html("<div class='profileSection' style='width: 20%; text-align: center;'><h2 class='label'>" + 
                        dataTable[type][actorData.id].name +
                        "</h2><img src='images/" + type + "Icons/" +
                        dataTable[type][actorData.id].name.replace(/ |-|\'/gi, "") + ".png' /></div>" +
                        "<div class='profileSection' style='width: 80%;'>Actor: " + dataTable[type][actorData.id].actor +
                        "<br>Parameters: " + actorData.parameters +
                        "<br>Drop: " + drop + " <br>" + 
                        dropTable + "</div>");
}

function setSearch(data, type) { //Sets global actor search to the actor clicked, adds temporary popover, and changes tabs to Search tab
  var actorData = data.parent().data();
  $('select#' + type + 'Filter').val([actorData.id]).trigger('change');
  $('#' + type + 'SearchTab').tooltipster('open');
  $('#' + type + 'SearchTab').trigger('click');
  setTimeout(function(){$('#' + type + 'SearchTab').tooltipster('close');}, 3000);
  highlightActors();
}

function setZoom(data, type) { //Zooms in on the room where an actor is located
  var enemyData = data.parent().data();
  var foundLayer = false;
  roomLayer.eachLayer(function(layer) {
    if(!foundLayer && enemyData.scene == layer.feature.properties.scene && enemyData.room == layer.feature.properties.id)
    {
      updateLocationChanger(romScene = enemyData.scene, romRoom = enemyData.room)
      map.fitBounds(layer.getBounds());
      foundLayer = true;
    }
  });
}

  