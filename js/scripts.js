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
    var tab = newTab.currentTarget.id;
    switch(tab){
    case 'dataTab':
        $('#' + tab + 'UpperText').append($('#locationChangerContainer'));
      break;
    case 'natureTab':
        $('#' + tab + 'UpperText').append($('#locationChangerContainer'));
      break;
    case 'enemiesTab':
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
//  enemiesLayer = addEnemyOverlay(loadEnemies());
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

  var enemyTextHeight = $('#enemiesTabUpperText').outerHeight(true);
  var locationChangerHeight = $('#locationChangerContainer').outerHeight(true);
  var enemySearchHeight = $('#enemyFilterContainer').outerHeight(true);
  
  $('#verboseOutput').css("height", sidebarHeight-dataTextHeight-20);
  $('#enemiesTableContainer').css("height", sidebarHeight-(enemyTextHeight+locationChangerHeight)-50);
  $('#enemiesSearchContainer').css("height", sidebarHeight-(enemyTextHeight+enemySearchHeight)-50);
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
  //Enemy Markers Showing as Grouped by Scene or By Room at Various Zooms
  if(map.getZoom() < 13){
    $('.enemySceneContainer').show();
    $('.enemyRoomContainer').hide();
  }
  else {
    $('.enemySceneContainer').hide();
    $('.enemyRoomContainer').show();
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
  $('ul.tabs li').click(function(){
		var tab_id = $(this).attr('data-tab');

		$('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		$(this).addClass('current');
		$("#"+tab_id).addClass('current');
    fixSidebarHeight();
	});
  $('#searchEnemiesTab').tooltipster({trigger: 'custom'});
  fetchEnemies(romScene, romRoom);
  searchEnemies();
  fixSidebarHeight();
});

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
var enemiesLayer = addEnemyOverlay(loadEnemies());

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

function loadEnemies() { //Finds center of each room/scene and adds a container with thumbnails of each enemy in that room/scene

  var enemyRoomIconContainers = Array();
  roomLayer.eachLayer(function (room){
    var coords = room.getBounds().getCenter()
    if(typeof mapData[room.feature.properties.scene].rooms[room.feature.properties.id].enemies != 'undefined')
    enemyRoomIconContainers.push(
    {
         "type": "Feature", 
         "geometry": { 
           "type": "Point", 
           "coordinates": [coords.lng, coords.lat]
         }, 
         "properties": { 
           "room": room.feature.properties.id,
           "class": "enemyRoomContainer enemyMarkerContainer enemyMarkers" + room.feature.properties.scene + "r" + room.feature.properties.id,
           "type": "enemyRoomContainer",
           "scene": room.feature.properties.scene,
           "enemies": mapData[room.feature.properties.scene].rooms[room.feature.properties.id].enemyCounts
           }
    });
  });
  var enemySceneIconContainers = Array();
  sceneLayer.eachLayer(function (scene){
    var coords = scene.getBounds().getCenter();
    if(typeof mapData[scene.feature.properties.id].enemyCounts != 'undefined' && scene.feature.properties.id != 62) //Only push rooms with enemies, and NOT grotto scene
    enemySceneIconContainers.push(
    {
         "type": "Feature", 
         "geometry": { 
           "type": "Point", 
           "coordinates": [coords.lng, coords.lat]
         }, 
         "properties": { 
           "room": -1,
           "class": "enemySceneContainer enemyMarkerContainer enemyMarkers" + scene.feature.properties.id,
           "type": "enemySceneContainer",
           "scene": scene.feature.properties.id,
           "enemies": mapData[scene.feature.properties.id].enemyCounts
           }
    });
  });
  
  return {rooms: enemyRoomIconContainers, scenes: enemySceneIconContainers};
}

function getEnemyImages(enemies) { //Gets image files and generates their HTML for array of enemies passed
  var images = "";
  for(i in enemies)
  {
    var enemyName = enemyTable[enemies[i].id].name.replace(/ |-|\'/gi, "")
    images += "<img class='enemyIcon enemyIcon" + enemies[i].id + "' src='images/enemyIcons/" + enemyName + ".png' />";
  }
  return images;
}

function addEnemyOverlay(enemyContainers) { //Adds enemy icons to the map(all of them) for later usage and filtering
  var overlayLayers = Array();
  for(var i in enemyContainers)
  {
    overlayLayers.push(L.geoJSON(enemyContainers[i], {
      pointToLayer: function(feature, latlng) {
          return L.marker(latlng, {
            icon: new L.divIcon({className: feature.properties.class,
            iconSize: null,
            html: getEnemyImages(feature.properties.enemies)
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
  fetchEnemies(scene, room);
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

function fetchEnemies(scene, room) { //Finds and lists enemies in the currently viewed scene/room
  var roomEnemies = new Array();
  var table = $("#enemiesTable");
  if(room == "-1") {
    $("#enemiesTable").html("<tr><th>No Enemies Exist on the Scene Level</th></tr>");
    return 0;
  }
  else {
    roomEnemies = mapData[scene].rooms[room].enemies;
  }
  if(typeof roomEnemies == "undefined") {
    $("#enemiesTable").html("<tr><th>No Enemies Found in Room Selected</th></tr>");
    return 0;
  }
  
  var currentSetup = -1;
  $('.enemyRow').tooltipster('destroy');
  table.html("<tr><th>Name</th><th>Details</th><th>Search</th></tr>");
  var tableData = [];
  for(i in roomEnemies) {
    var enemy = roomEnemies[i];
    if(enemy.setup != currentSetup) {
      var setupName = "";
      currentSetup = enemy.setup;
      for (var i in mapData[romScene].setups) {
        if(mapData[romScene].setups[i].id == currentSetup && mapData[romScene].setups[i].name != "") {
          setupName = " - " + mapData[romScene].setups[i].name;
        }
      }
      tableData.push("<tr><td colspan='3' class='enemySetupSplit'>Scene Setup: " + currentSetup + setupName + "</td></tr>");
    }
    var newRow = enemyTableRow(enemy);
    tableData.push(newRow);
    table.scrollTop(0).scrollLeft(0);
    //fa fa-window-maximize (Might later add a way to view the data all together in a larger window)
  }
  table.append(tableData);
}

////////////////////////////////////////////////////////////////////////////////
// Enemy Search Interface and Functionalities
////////////////////////////////////////////////////////////////////////////////

var enemySelect = new Array();
var enemySelectAll = new Array();
for(var i in enemyTable) {
  enemySelect.push({id: i, text: enemyTable[i].actor + ": " + enemyTable[i].name});
  enemySelectAll.push(i);
}

$('#enemyFilter').select2({data: enemySelect,
                           placeholder: "Select Enemies",
                           closeOnSelect:false});

$('#enemyFilter').on("change", function (e) {
  $('.enemyIcon').hide();
  var enemiesSelected = $('#enemyFilter').select2("data");
  var enemiesShown = "";
  for(i in enemiesSelected) {
    enemiesShown += ".enemyIcon" + enemiesSelected[i].id + ",";
  }
  $(enemiesShown.slice(0,-1)).show();
  $('#enableRegions').attr('checked', false).trigger('change');
  searchEnemies();
});

$('#enemiesShowAll').on('click', function(){$('select#enemyFilter').val(enemySelectAll).trigger('change');});
$('#enemiesHideAll').on('click', function(){
  $('select#enemyFilter option').attr('selected', false);
  $('select#enemyFilter').val(null).trigger('change');
});


$('#enemiesHighlightAll').on('click', function(){
  highlightEnemies();
});

var currentlyHighlighting = false;
function highlightEnemies(){ //Puts an alternating glow/shadow on all visible enemy icons for 8 seconds
    if(currentlyHighlighting == false)
  {
    currentlyHighlighting = true;
    $('.enemyIcon').addClass('glow');
    setTimeout(function(){
      $('.enemyIcon').removeClass('glow');
      currentlyHighlighting = false;
    }, 8000);
  }
}

function searchEnemies() { //Finds and updates table and map icons with enemies in current filter
  var table = $("#enemiesSearchTable");
  if($('#enemyFilter').select2("data").length === 0){
    table.html("<tr><th>No Enemies Selected</th></tr>");
    return 0;
  }
  
  enemyResults = filterCurrentEnemies();
  var currentScene = -1;
  var currentSetup = -1;
  var currentRoom = -1;
  $('.enemySearchRow').tooltipster('destroy');
  table.html("<tr><th>Name</th><th>Details</th><th>Zoom</th></tr>");
  var tableData = [];
  for(i in enemyResults) {
    var enemy = enemyResults[i];
    if(enemy.scene != currentScene || enemy.setup != currentSetup)
    {
      var setupName = "";
      currentScene = enemy.scene;
      currentSetup = enemy.setup;
      for (var i in mapData[currentScene].setups) {
        if (mapData[currentScene].setups[i].id == currentSetup){
          if(mapData[currentScene].setups[i].name != ""){
            setupName = " (" + mapData[currentScene].setups[i].name + ")";
          }
        }
      }
      tableData.push("<tr><td colspan='3' class='enemySetupSplit'>Scene: " + currentScene + " (" + mapData[currentScene].name + "), Setup: " + currentSetup + setupName + "</td></tr>");
    }
    var newRow = enemyTableRow(enemy);
    tableData.push(newRow);
    table.scrollTop(0).scrollLeft(0);
    //fa fa-window-maximize (Might later add a way to view the data all together in a larger window)
  }
  table.append(tableData);
}

function filterCurrentEnemies() { //Finds enemies that match the current filter in the enemy search bar, returns array of their IDs
  var currentSelection = $('#enemyFilter').select2("data");
  var currentFilter = new Array();
  var enemiesFound = new Array();
  
  for(var i in currentSelection){
    currentFilter.push(parseInt(currentSelection[i].id));
  }
  for(var i in enemies){
    if($.inArray(enemies[i].id, currentFilter) !== -1){
      enemiesFound.push(enemies[i]);
    }
  }
  return enemiesFound;
}


////////////////////////////////////////////////////////////////////////////////
// Creation of Rows and their functionalities in Enemy Tables
////////////////////////////////////////////////////////////////////////////////

function enemyTableRow(enemy) { //Generates a row for Enemy Location table, passed a fresh enemy object
  var locationData = "";
  var rowType = "enemyRow";
  var lookType = "Search";
  var lookFunction = setEnemySearch;
  var checkIcon = "binoculars";
  if(typeof enemy.scene != 'undefined') { //Swap variables over if the row is on the Search page
    locationData =     "' data-scene='" + enemy.scene + 
    "' data-room='" + enemy.room;
    rowType="enemySearchRow";
    lookType = "Zoom";
    lookFunction = setEnemyZoom;
    checkIcon = "search-plus";
  }
  $("#tooltip_content").html(enemyDataTable(enemy));
  var newRow = $("<tr data-tooltip-content='#tooltip_content' class='" + rowType + "' data-id='" + enemy.id + 
    locationData +
    "' data-parameters='" + enemy.parameters + 
    "' data-setup='" + enemy.setup + 
    "' data-position='"  + enemy.position +  
    "' data-rotation='"  + enemy.rotation +
    "'><td><div>" + enemyTable[enemy.id].name + "</div></td><td class='enemyDetails'><i class='fa fa-book enemyDetails'></i></td><td class='enemy" + lookType + "'><i class='fa fa-" + checkIcon + "'></i></td></tr>");
  
  newRow.find('td.enemyDetails').on('click', function(e){
    updateModalEnemy($(this));
    $('#openModal').modal();
  });
  newRow.find('td.enemy' + lookType).on('click', function(e){
    lookFunction($(this));
  });
  
  createEnemyTooltip(newRow);
  return newRow;
}

function enemyDataTable(enemy) { //Creates the table used in the enemy tooltips, passed an enemy object pre-rotation/position additions and adds them.
  enemy.position = enemy.x + "," + enemy.y + "," + enemy.z;
  enemy.rotation = enemy['x-rotation'] + "," + enemy['y-rotation'] + "," + enemy['z-rotation'];
  
  return "<table><tr><th>Actor</th><th>Parameters</th><th>Drop Table</th><th>Position</th><th>Rotation</th></tr>" +
         "<tr><td>" + enemyTable[enemy.id].actor + "</td><td>" + enemy.parameters + "</td><td>" +
         enemyTable[enemy.id].drop + "</td><td>(" +  enemy.position + ")</td><td>(" + enemy.rotation + ")</td></tr></table>";
}

function createEnemyTooltip(newRow) { //Generates the tooltip placed on an enemy row, must have updated the modal before calling with function enemyDataTable, passed the row to add Tooltipster to
    newRow.tooltipster({
    theme: ['tooltipster-shadow', 'tooltipster-shadow-customized'],
    delay: [200,300],
    trigger: 'custom',
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

function updateModalEnemy(enemy) { // Updates the popup with enemy details and generates the visual Drop Table, passed "Details" button that was clicked
  var enemyData = enemy.parent().data();
  var drop = "None";
  var dropTable = "";
  if(enemyTable[enemyData.id].drop != ''){
    drop = "Table " + enemyTable[enemyData.id].drop;
    table = dropTables[enemyTable[enemyData.id].drop].table;
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
                        enemyTable[enemyData.id].name +
                        "</h2><img src='images/enemyIcons/" +
                        enemyTable[enemyData.id].name.replace(/ |-|\'/gi, "") + ".png' /></div>" +
                        "<div class='profileSection' style='width: 80%;'>Actor: " + enemyTable[enemyData.id].actor +
                        "<br>Parameters: " + enemyData.parameters +
                        "<br>Drop: " + drop + " <br>" + 
                        dropTable + "</div>");
}

function setEnemySearch(enemy) { //Sets global enemy search to the enemy clicked, adds temporary popover, and changes tabs to Search tab
  var enemyData = enemy.parent().data();
  $('select#enemyFilter').val([enemyData.id]).trigger('change');
  $('#searchEnemiesTab').tooltipster('open');
  $('#searchEnemiesTab').trigger('click');
  setTimeout(function(){$('#searchEnemiesTab').tooltipster('close');}, 3000);
  highlightEnemies();
}

function setEnemyZoom(enemy) { //Zooms in on the room where an enemy is located
  var enemyData = enemy.parent().data();
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

  