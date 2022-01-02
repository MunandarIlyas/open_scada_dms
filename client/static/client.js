var socket, schema_leafletmap, schema_svgRoot, schema_in_view, svglayer, gis_svgRoot, gis_in_view, gis_map, geojsonlayer, editableLayers;
var moving_object;

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
  editableLayers = new L.FeatureGroup();
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


  
  geojsonlayer = L.geoJSON().addTo(gis_map);
  //register svg events
  gis_map.on(L.Draw.Event.CREATED, addItem);//*/
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
  let linkElement = document.createElement('a');
  linkElement.setAttribute('href', 'data:' + convertedData);
  linkElement.setAttribute('download','data.geojson');
  linkElement.click();
}

//https://stackoverflow.com/questions/62305306/invert-y-axis-of-lcrs-simple-map-on-vue2-leaflet
var CRSPixel = L.Util.extend(L.CRS.Simple, {
	transformation: new L.Transformation(1,0,1,0)
});

function init_schema(){
  svglayer = {};
  schema_svgRoot = {};
  schema_in_view = [];
  document.getElementById("mmi_svg").style.display = "block";
  
  schema_leafletmap = L.map('mmi_svg', { 
    renderer: L.svg(), 
    crs: CRSPixel,
    minZoom: -5,
    maxZoom: 10
  }).setView([0,0], 1);

  editableLayers = new L.FeatureGroup();
  schema_leafletmap.addLayer(editableLayers);


  var options = {
    position: 'topright',
    draw: {
      polyline: true,
      polygon: {
        allowIntersection: false, // Restricts shapes to simple polygons 
        drawError: {
          color: '#e1e100', // Color the shape will turn when intersects 
          message: '<strong>Error: line intersects!<strong> intersecting polygons are not allowed' // Message that will show when intersect 
        }
      },
      circle: true, // Turns off this drawing tool 
      rectangle: true,
      marker: true,
      svg: true
    },
    edit: {
      featureGroup: editableLayers, //REQUIRED!! 
      remove: true
    }
  };
  
  var drawControl = new L.Control.Draw(options);
  schema_leafletmap.addControl(drawControl);

  //var drawSvgControl = new L.Control.DrawSvg({position: 'topright', draw: { }, edit: { featureGroup: editableLayers, remove: true  }});
  //schema_leafletmap.addControl(drawSvgControl);


  geojsonlayer = L.geoJSON().addTo(schema_leafletmap);

  schema_leafletmap.on(L.Draw.Event.CREATED, addItem);
  schema_leafletmap.on('moveend', update_schema);
  schema_leafletmap.on('zoomend', update_schema);
  schema_leafletmap.setZoom(0);
  //schema_leafletmap.fitBounds(bounds);

  moving_object = null;

  schema_leafletmap.on('click', function(a){
    if(moving_object != null && a.originalEvent.ignore !== true) {
      moving_object.enable_move = false;
      schema_leafletmap.off('mousemove',moveobj);
      moving_object = null;
    }
  });
}

//var wrap_moveobj = function(e){ moveobj(e,aa);};
var moveobj = function (d) {
  if(this.enable_move == true){
    bounds = this._bounds;
    var g1 = (bounds._northEast.lat - bounds._southWest.lat)/2;
    var g2 = (bounds._northEast.lng - bounds._southWest.lng)/2;
    var dif1 = d.latlng.lat - g1;
    var dif2 = d.latlng.lat + g1;
    var dif3 = d.latlng.lng - g2;
    var dif4 = d.latlng.lng + g2;
    
    this.setBounds([[dif1,dif3],[dif2,dif4]]);
  }
}

function addItem(e) {
  //gis_map.on(L.Draw.Event.CREATED, function(e) {
  var type = e.layerType, layer = e.layer;

  if (type === 'marker') {
    layer.bindPopup('A popup!');
  }
  if (type === 'svg') {
    if (layer.uuid === null){
      layer.uuid = "_123";
    }
  }
  //svg_add_to_schema(0,0,100,100,"<>","aaa");
  editableLayers.addLayer(layer);
}

function deinit_schema(){

  schema_leafletmap.off('draw:created',addItem)
  schema_leafletmap.off('moveend', update_schema);
  schema_leafletmap.off('zoomend', update_schema);

  var schema_map = document.getElementById("mmi_svg");
  schema_map.style.display = "none";
  schema_leafletmap.remove();
  schema_svgRoot.innerHTML = "";
  schema_map.innerHTML = "";

  delete svglayer;
  delete schema_leafletmap;
  delete schema_svgRoot;
  delete schema_in_view;

  svglayer = null;
  schema_leafletmap = null;
  schema_svgRoot = null;
  schema_in_view = null;
}

function deinit_gis(){
  gis_map.off('draw:created', addItem);//*/
  gis_map.off('moveend', update_gis);
  gis_map.off('zoomend', update_gis);

  var gis_div = document.getElementById("gis_map");
  gis_div.style.display = "none";
  gis_map.remove();
  gis_svgRoot.innerHTML = "";
  gis_div.innerHTML = "";

  delete gis_svgRoot;
  delete gis_in_view;
  delete gis_map;
  delete geojsonlayer;

  gis_svgRoot = null;
  gis_in_view = null;
  gis_map = null;
  geojsonlayer = null;
}

function toggle_view() {
  var gis = document.getElementById("gis_map");
  var schema_div = document.getElementById("mmi_svg");
  if (gis.style.display === "none") {
    document.getElementById("mmi_svg").style.display = "none";
    document.getElementById("gis_map").style.display = "block";
    //deinit_schema();
    //init_gis();
  } else {
    document.getElementById("mmi_svg").style.display = "block";
    document.getElementById("gis_map").style.display = "none";
    //deinit_gis();
    //init_schema();
  }
} 

$(document).ready(function() {
  namespace = '';


  socket = io.connect('http://' + document.domain + ':' + location.port + namespace);


  init_gis();
  init_schema();
  document.getElementById("mmi_svg").style.display = "block";
  document.getElementById("gis_map").style.display = "none";

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
  //pos = schema_leafletmap.getCenter();
  zoom = schema_leafletmap.getZoom();
  bounds = schema_leafletmap.getBounds();
  socket.emit('get_svg_for_schema', {'x': bounds.getWest(), 'y': bounds.getSouth(), 'z': zoom, 'in_view': schema_in_view, 'x2': bounds.getEast(), 'y2': bounds.getNorth()});
  //console.log('w:' + bounds.getWest() + ' n:' + bounds.getNorth() + ' e:' + bounds.getEast() + ' s:' + bounds.getSouth() + ' z:' + schema_leafletmap.getZoom());
} 

function svg_add_to_schema(x, y, x2, y2, svgString, svgId) {
  schema_svgRoot[svgId] = new DOMParser().parseFromString(svgString, "image/svg+xml").documentElement;
  var dimension = "0 0 " + (x2-x).toString() + " " + (y2-y).toString();// dimension matches svgOverlay size, to create 1-to-1 pixel mapping
  schema_svgRoot[svgId].setAttribute('viewBox', dimension );

  options = {
    'interactive': true,
  };
  var aa = L.svgOverlay(schema_svgRoot[svgId], [ [ y,x], [ y2,x2 ] ], options).addTo(schema_leafletmap);
  //console.log("x:" + x + " y:" + y + " x2:" + x2 + " y2:" + y2); 
  schema_svgRoot[svgId].id = svgId;
  schema_svgRoot[svgId].svgOverlay = aa;
  aa.enable_move = false;
  aa.on('click', function(d) {
    if(d.target.enable_move != null && moving_object == null){
      if(d.target.enable_move == false){
        d.target.enable_move = true;
        moving_object = aa;
        schema_leafletmap.on('mousemove',moveobj.bind(aa));
        //L.DomEvent.on(aa, 'click', L.DomEvent.stopPropagation);
        d.originalEvent.ignore = true;  //custom propery for this event, to prevent triggering the global one
      } else {
        d.target.enable_move = false;
        moving_object = null;
        schema_leafletmap.off('mousemove',moveobj);
      }
    }
  }); 
  return schema_svgRoot[svgId];
}


function newSchemaObject(){
  if(moving_object != null)
  {
    moving_object.enable_move = false;
    schema_leafletmap.off('mousemove',moveobj);
    moving_object = null;
  }
  var aa = svg_add_to_schema(0, 0, 100, 100, '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" /></svg>', "_12345");
  aa.svgOverlay.enable_move = true;
  moving_object = aa.svgOverlay;
  schema_leafletmap.on('mousemove',moveobj.bind(aa.svgOverlay));

}


var update_gis = function(){ 
  //pos = gis_map.getCenter();
  zoom = gis_map.getZoom();
  bounds = gis_map.getBounds();
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

  options = {
    'interactive': true,
  };
  var aa = L.svgOverlay(gis_svgRoot[svgId], [ [ latitude-la,longtitude-lo], [ latitude+la,longtitude+lo ] ], options).addTo(gis_map);
  
  aa.enable_move = false;

  aa.on('click', function(d) {
    if(d.target.enable_move == false){
      d.target.enable_move = true;
    } else {
      d.target.enable_move = false;
    }
  });

  aa.on('mousemove', function(d) {
    if(d.target.enable_move == true){
      bounds = this._bounds;
      var g1 = (bounds._northEast.lat - bounds._southWest.lat)/2;
      var g2 = (bounds._northEast.lng - bounds._southWest.lng)/2;
      var dif1 = d.latlng.lat - g1;
      var dif2 = d.latlng.lat + g1;
      var dif3 = d.latlng.lng - g2;
      var dif4 = d.latlng.lng + g2;
      
      this.setBounds([[dif1,dif3],[dif2,dif4]]);
    }
  });

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

var get_svg_templates = function()
{
  return [["PTR",[[0,0],[550,514]],"<line id=\"S12/D1/Q1/L1\" class=\"LINE\" stroke-linecap=\"undefined\" stroke-linejoin=\"undefined\" y2=\"153.934719\" x2=\"266\" y1=\"93.434721\" x1=\"266\" stroke-width=\"1.5\" stroke=\"#ffffff\" fill=\"none\"/>\n\n<g id=\"S12/D1/T1\">\n<title>PTR</title>\n<ellipse id=\"svg_T1_a\" ry=\"18\" rx=\"18\" cy=\"171.753014\" cx=\"266\" fill-opacity=\"null\" stroke-width=\"1.5\" stroke=\"#ffffff\" fill=\"none\"/>\n<text    id=\"svg_T1_name\" stroke=\"#ffffff\"  xml:space=\"preserve\" text-anchor=\"start\" font-family=\"Helvetica, Arial, sans-serif\" font-size=\"24\" y=\"186.66199\" x=\"296\" stroke-width=\"null\" fill=\"#ffffff\">T1</text>\n<ellipse id=\"svg_T1_b\" ry=\"18\" rx=\"18\" cy=\"196.290907\" cx=\"266\" fill-opacity=\"null\" stroke-width=\"1.5\" stroke=\"#ffffff\" fill=\"none\"/>\n</g>\n\n<line id=\"S12/E1/Q1/L2\" class=\"LINE\" stroke=\"#ffffff\" stroke-linecap=\"undefined\" stroke-linejoin=\"undefined\" y2=\"256.43483\" x2=\"266\" y1=\"214.934859\" x1=\"266\" stroke-width=\"1.5\" fill=\"none\"/>\n"],
          ["CBR",[[0,0],[550,514]],"<g id=\"S12/E1/Q1/QA1\" class=\"draggable-group\">\n<title>CBR</title>\n<text id=\"$datapoint_1\"     class=\"MEAS\" data-text=\"CBR: QA1=\\{value\\}\" fill=\"#ffffff\" stroke=\"#ffffff\" x=\"296\" y=\"272.166593\" font-size=\"12\" font-family=\"Helvetica, Arial, sans-serif\" text-anchor=\"start\" xml:space=\"preserve\" font-weight=\"normal\" font-style=\"normal\"></text>\n<rect id=\"$datapoint_2\"     class=\"XCBR\" height=\"22.553162\" width=\"19.999974\" y=\"257.946454\" x=\"256.364398\" stroke-width=\"1.5\" stroke=\"#ffffff\" fill=\"#ffffff\">\n  <animate id=\"open\" attributeName=\"fill\" attributeType=\"XML\" to=\"black\" dur=\"100ms\" fill=\"freeze\" />\n  <animate id=\"transition\" attributeName=\"fill\" attributeType=\"XML\" to=\"green\" dur=\"10ms\" fill=\"freeze\" />\n  <animate id=\"close\" attributeName=\"fill\" attributeType=\"XML\"  to=\"white\" dur=\"100ms\" fill=\"freeze\" /> \n  <animate id=\"error\" attributeName=\"fill\" attributeType=\"XML\"  to=\"red\" dur=\"10ms\" fill=\"freeze\" />           \n</rect>\n<rect id=\"$datapoint_3\"     class=\"CSWI\" height=\"22.553162\" width=\"19.999974\" y=\"257.946454\" x=\"256.364398\" stroke-width=\"1.5\" stroke=\"none\" fill=\"none\"/>\n</g>"],
          ["SWI",[[0,0],[550,514]],"<g id=\"S12/E1/Q1/QB1\" class=\"draggable-group\">\n<title>SWI</title>\n<text id=\"$datapoint_1\"     class=\"MEAS\" data-text=\"DIS: QB1=\\{value\\}\" fill=\"#ffffff\" stroke=\"#ffffff\" x=\"296\" y=\"314.666538\" font-size=\"12\" font-family=\"Helvetica, Arial, sans-serif\" text-anchor=\"start\" xml:space=\"preserve\" font-weight=\"normal\" font-style=\"normal\"></text>\n<rect id=\"$datapoint_2\"    class=\"CSWI\" height=\"19\" width=\"19\" y=\"300.49959\" x=\"256.864387\" stroke=\"#ffffff\" fill=\"#000000\"/> \n<line id=\"$datapoint_3\"     class=\"XSWI\" stroke=\"#ffffff\" stroke-linecap=\"undefined\" stroke-linejoin=\"undefined\" y2=\"320\" x2=\"266\" y1=\"300\" x1=\"266\" stroke-width=\"4\" fill=\"none\">\n    <animateTransform id=\"open\" attributeName=\"transform\" attributeType=\"XML\" type=\"rotate\" to=\"90 266 310 \" dur=\"100ms\" fill=\"freeze\" />\n    <animateTransform id=\"close\" attributeName=\"transform\" attributeType=\"XML\" type=\"rotate\" to=\"0 266 310 \" dur=\"100ms\" fill=\"freeze\" />\n    <animateTransform id=\"transition\" attributeName=\"transform\" attributeType=\"XML\" type=\"rotate\" to=\"45 266 310 \" dur=\"100ms\" fill=\"freeze\" />\n    <animateTransform id=\"error\" attributeName=\"stroke\" attributeType=\"XML\" to=\"red\" dur=\"100ms\" fill=\"freeze\" />\n</line>\n</g>"],
          ["Load",[[0,0],[550,514]],"<line id=\"S12/E1/W1/BB1\" class=\"LINE\" stroke=\"#ffffff\" stroke-linecap=\"undefined\" stroke-linejoin=\"undefined\" y2=\"360\" x2=\"266\" y1=\"320.436511\" x1=\"266\" stroke-width=\"1.5\" fill=\"none\"/>\n<text id=\"LOAD\" class=\"LOAD\" stroke=\"#ffffff\"  xml:space=\"preserve\" text-anchor=\"middle\" font-family=\"Helvetica, Arial, sans-serif\" font-size=\"24\" y=\"380\" x=\"266\" fill=\"#ffffff\">Load</text>\n"],
          ["Feed",[[0,0],[550,514]],"<title>Bay 1</title>\n<text id=\"IFL\" class=\"IFL\" stroke=\"#ffffff\" xml:space=\"preserve\" text-anchor=\"middle\" font-family=\"Helvetica, Arial, sans-serif\" font-size=\"24\" y=\"80\" x=\"266\" fill=\"#ffffff\">220KV Feed</text>\n<ellipse id=\"svg_top\" stroke=\"#ffffff\" ry=\"2.424242\" rx=\"2.121212\" cy=\"91.858974\" cx=\"266\" fill-opacity=\"null\" stroke-width=\"1.5\" fill=\"none\"/>\n"]];
}

	//.leaflet-modal
L.Draw.Svg.include({
	  enable: function(){
      var drawsvg = this;

      var templates = get_svg_templates();
      var options = "";
      for(var i = 0; i < templates.length; i++){
        options += '<option value="'+i.toString()+'"> '+ templates[i][0] +' </option>';
      }
      
      this._map.fire('modal', {
        title: 'Select SVG template',

        content: ['<select name="SVG-templates">',
        options,
        '</select><br><br>'].join(''),

        template: ['<div class="modal-header"><h2>{title}</h2></div>',
          '<hr>',
          '<div class="modal-body">{content}</div>',
          '<div class="modal-footer">',
          '<button class="topcoat-button--large {OK_CLS}">{okText}</button>',
          '<button class="topcoat-button--large {CANCEL_CLS}">{cancelText}</button>',
          '</div>'
        ].join(''),
      
        okText: 'Ok',
        cancelText: 'Cancel',
        OK_CLS: 'modal-ok',
        CANCEL_CLS: 'modal-cancel',
      
        width: 300,
      
        onShow: function(evt) {
          var modal = evt.modal;
          L.DomEvent
          .on(modal._container.querySelector('.modal-ok'), 'click', function() {
            var sel = modal._container.querySelector('select[name="SVG-templates"]');
            drawsvg._templateBounds = templates[sel.value][1];
            drawsvg._template = templates[sel.value][2];

            L.Draw.SimpleShape.prototype.enable.call(drawsvg);
            modal.hide();
          })
          .on(modal._container.querySelector('.modal-cancel'), 'click', function() {
            modal.hide();
          });
        }
      });
	}
});