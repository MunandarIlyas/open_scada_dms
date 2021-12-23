var socket, schema_leafletmap, schema_svgRoot, schema_in_view, svglayer, gis_svgRoot, gis_in_view, gis_map, geojsonlayer;

function init_gis(){
  geojsonlayer = {};
  gis_svgRoot = {};
  gis_in_view = [];
  var gis_div = document.getElementById("gis_map");
  gis_div.style.display = "block";

  gis_map = L.map('gis_map', { renderer: L.svg()}).setView([51.980, 5.842], 17);
  //gis_map = new L.Map('gis_map').setView([51.980, 5.842], 17);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'openstreetmap',
    maxZoom: 20,
    id: 'openstreetmap',
    tileSize: 512,
    zoomOffset: -1,
  }).addTo(gis_map);//*/


  //https://codepen.io/mochaNate/pen/bWNveg
  var editableLayers = new L.FeatureGroup();
  gis_map.addLayer(editableLayers);

  var options = {
    position: 'topright',
    draw: {
      polyline: true,
      polygon: {
        allowIntersection: false, // Restricts shapes to simple polygons 
        drawError: {
          color: '#e1e100', // Color the shape will turn when intersects 
          message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect 
        }
      },
      circle: true, // Turns off this drawing tool 
      rectangle: true,
      marker: true
    },
    edit: {
      featureGroup: editableLayers, //REQUIRED!! 
      remove: true
    }
  };
  
  var drawControl = new L.Control.Draw(options);
  gis_map.addControl(drawControl);

  gis_map.on('draw:created', function(e) {
  //gis_map.on(L.Draw.Event.CREATED, function(e) {
    var type = e.layerType,
      layer = e.layer;
  
    if (type === 'marker') {
      layer.bindPopup('A popup!');
    }
  
    editableLayers.addLayer(layer);
  });//*/
  

  geojsonlayer = L.geoJSON().addTo(gis_map);
  //register svg events
  gis_map.on('moveend', update_gis);
  gis_map.on('zoomend', update_gis);
  gis_map.setZoom(18);
}

function exportGeoJSON(featureGroup) {
  // Extract GeoJson from featureGroup
  var data = featureGroup.toGeoJSON();
  // Stringify the GeoJson
  var convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
  // Create export
  document.getElementById('export').setAttribute('href', 'data:' + convertedData);
  document.getElementById('export').setAttribute('download','data.geojson');
}

function init_schema(){
  svglayer = {};
  schema_svgRoot = {};
  schema_in_view = [];
  var schema_div = document.getElementById("mmi_svg");
  schema_div.style.display = "block";

  schema_leafletmap = L.map('mmi_svg', { renderer: L.svg(), crs: L.CRS.Simple }).setView([0,0], -10);
  var bounds = [[0,0], [1000,1000]];
  svglayer = L.geoJSON().addTo(schema_leafletmap,bounds);
  schema_leafletmap.on('moveend', update_schema);
  schema_leafletmap.on('zoomend', update_schema);
  schema_leafletmap.setZoom(-9);
  //schema_leafletmap.fitBounds(bounds);
}

function deinit_schema(){
  var schema_map = document.getElementById("mmi_svg");
  schema_map.style.display = "none";
  schema_leafletmap.remove();
  schema_svgRoot.innerHTML = "";
  delete svglayer;
  delete schema_leafletmap;
  delete schema_svgRoot;
  delete schema_in_view;
}

function deinit_gis(){
  var gis_div = document.getElementById("gis_map");
  gis_div.style.display = "none";
  gis_map.remove();
  gis_svgRoot.innerHTML = "";

  delete gis_svgRoot;
  delete gis_in_view;
  delete gis_map;
  delete geojsonlayer;
}

function toggle_view() {
  var gis = document.getElementById("gis_map");
  var schema_div = document.getElementById("mmi_svg");
  if (gis.style.display === "none") {
    deinit_schema();
    init_gis();
  } else {
    deinit_gis();
    init_schema();
  }
} 

$(document).ready(function() {
  namespace = '';


  socket = io.connect('http://' + document.domain + ':' + location.port + namespace);

  init_schema();
  //init_gis();
  //deinit_gis();
  //deinit_schema();

  //add info to the ied/datamodel tab
  socket.on('svg_value_update_event_on_schema', function (data) {
    //event gets called from server when svg data is updated, so update the svg
    var element = data['element'];
    var value = data['data']['value'];
    var type = data['data']['type'];
  });

  socket.on('svg_object_add_to_schema', function (data) {
    //add svg to object
    node = svg_add_to_schema(data['x'],data['y'],data['x2'],data['y2'],data['svg'],data['id']);
    if(node == null){
      return;
    }

    schema_in_view.push(data['id']);

      //register for all values in loaded svg
    $("g",node).find("*").each(function(idx, el){
      var cl = el.classList.toString();
      //console.log("el.id:" + el.id + " cl:"+cl);
      if(el.id.startsWith("iec60870://") == true){    
        if(cl == "XCBR"){ $("#close",el)[0].beginElementAt(1.0); }
        if(cl == "XSWI"){ $("#open",el)[0].beginElementAt(1.0); }
      }
    });
  });

  socket.on('svg_object_remove_from_schema', function (data) {
    //remove svg from object
    var obj = schema_svgRoot[data];
    if(obj != null){
      //unregister values in this svg
      $("g",obj).find("*").each(function(idx, el){
        var cl = el.classList.toString();
        if(el.id.startsWith("iec60870://") == true){    
          //unregister
        }
      });
      obj.remove();
      var index = schema_in_view.indexOf(data);
      if (index > -1) {
        schema_in_view.splice(index, 1);
      }
    }

  });

  socket.on('svg_object_add_to_gis', function (data) {
    //add svg to object
    var node = svg_add_to_gis(data['x'],data['y'],data['x2'],data['y2'],data['svg'],data['id'],data['location']);
    if(node == null){
      return;
    }
    gis_in_view.push(data['id']);
      //register for all values in loaded svg
    $("g",node).find("*").each(function(idx, el){
      var cl = el.classList.toString();
      //console.log("el.id:" + el.id + " cl:"+cl);
      if(el.id.startsWith("iec60870://") == true){    
        if(cl == "XCBR"){ $("#close",el)[0].beginElementAt(1.0); }
        if(cl == "XSWI"){ $("#open",el)[0].beginElementAt(1.0); }
      }
    });
  });

  socket.on('svg_object_remove_from_gis', function (data) {
    //remove svg from object
    var obj = gis_svgRoot[data];
    if(obj != null){
      //unregister values in this svg
      $("g",obj).find("*").each(function(idx, el){
        var cl = el.classList.toString();
        if(el.id.startsWith("iec60870://") == true){    
          //unregister
        }
      });
      obj.remove();
      var index = gis_in_view.indexOf(data);
      if (index > -1) {
        gis_in_view.splice(index, 1);
      }
    }
  });

  socket.on('geojson_object_add_to_gis', function (json) {
    //add geojson to object
    if (json) {
      gis_map.removeLayer(geojsonlayer);
      geojsonlayer = L.geoJSON().addTo(gis_map);
      // Add the data to the layer
      geojsonlayer.addData(json);

      geojsonlayer.setStyle(geoStyle);
		}
  });

  socket.on('geojson_object_update_gis', function () {
    //add geojson to object
    geojsonlayer.setStyle(geoStyle);
  });

});


var update_schema = function(){ 
  pos = schema_leafletmap.getCenter();
  zoom = 100 + schema_leafletmap.getZoom();
  bounds = schema_leafletmap.getBounds();

  socket.emit('get_svg_for_schema', {'x': bounds.getWest(), 'y': bounds.getSouth(), 'z': zoom, 'in_view': schema_in_view, 'width': bounds.getEast()-bounds.getWest(), 'height': bounds.getNorth()- bounds.getSouth()});
  //socket.emit('get_svg', {data: ''} );
  console.log('w:' + bounds.getWest() + ' n:' + bounds.getNorth() + ' e:' + bounds.getEast() + ' s:' + bounds.getSouth());
  console.log(schema_leafletmap.getZoom())
} 

function svg_add_to_schema(x, y, x2, y2, svgString, svgId) {
  schema_svgRoot[svgId] = new DOMParser().parseFromString(svgString, "image/svg+xml").documentElement;
  var dimension = "0 0 " + (x2-x).toString() + " " + (y2-y).toString();
  schema_svgRoot[svgId].setAttribute('viewBox', dimension );

  L.svgOverlay(schema_svgRoot[svgId], [ [ y,x], [ y2,x2 ] ]).addTo(schema_leafletmap);

  schema_svgRoot[svgId].id = svgId;
  return schema_svgRoot[svgId];


}

var update_gis = function(){ 
  pos = gis_map.getCenter();
  zoom = gis_map.getZoom();
  bounds = gis_map.getBounds();
  
  //socket.emit('get_svg_for_gis', {'x': pos.lat, 'y': pos.lng, 'z': zoom, 'in_view': gis_in_view, 'width': gis_map.getSize().x, 'height': gis_map.getSize().y});
  socket.emit('get_svg_for_gis', {'w': bounds.getWest(), 'n': bounds.getNorth(), 'e': bounds.getEast(), 's': bounds.getSouth(), 'z': zoom, 'in_view': gis_in_view});
  //console.log('w:' + bounds.getWest() + ' n:' + bounds.getNorth() + ' e:' + bounds.getEast() + ' s:' + bounds.getSouth());
} 

function svg_add_to_gis(x, y, x2, y2, svgString, svgId, location) {
  gis_svgRoot[svgId] = new DOMParser().parseFromString(svgString, "image/svg+xml").documentElement;
  var dimension = "0 0 " + (x2-x).toString() + " " + (y2-y).toString();
  gis_svgRoot[svgId].setAttribute('viewBox', dimension );
  var la = location['height']/2;
  var lo = location['width']/2;
  var longtitude = location['coordinates'][0];
  var latitude = location['coordinates'][1];
  L.svgOverlay(gis_svgRoot[svgId], [ [ latitude-la,longtitude-lo], [ latitude+la,longtitude+lo ] ]).addTo(gis_map);

  gis_svgRoot[svgId].id = svgId;
  return gis_svgRoot[svgId];
}

var geoStyle = function(feature){
  color = "#ff7800";
  //retrieve color from real-time database
  if(feature.properties.id == "one"){ color = "#ffff00"; }
  return {
    "color": color,
    "weight": 5,
    "opacity": 0.65
  };
}
