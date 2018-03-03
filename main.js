require([
  "dojo/_base/connect",
  "dojo/dom",
  "dojo/dom-construct",
  "luciad/model/feature/FeatureModel",
  "luciad/model/store/MemoryStore",
  "luciad/reference/ReferenceProvider",
	"luciad/model/feature/Feature",
  "luciad/shape/ShapeFactory",
	"luciad/view/LayerType",
  "luciad/symbology/military/MilitarySymbologyPainter",
  "luciad/symbology/SymbologyProvider!MIL_STD_2525b",
  "luciad/symbology/SymbologyProvider!MIL_STD_2525c",
  "luciad/symbology/SymbologyProvider!APP_6A",
  "luciad/symbology/SymbologyProvider!APP_6B",
  "luciad/symbology/SymbologyProvider!APP_6C",
  "luciad/view/controller/EditController",
  "luciad/view/feature/FeatureLayer",
	"luciad/view/feature/BasicFeaturePainter",
	"luciad/view/feature/FeaturePainter",
  "samples/common/attribution/AttributionComponent",
  "samples/common/contextmenu/SampleContextMenu",
  "samples/common/LayerConfigUtil",
	"samples/common/IconFactory",
	"luciad/view/style/PointLabelPosition",
  "samples/lvc_map/SymbologyUtil",
  "samples/lvc_map/SymbologyPropertiesPanel",
  "samples/template/sample"
], function(
		connect,
		dom,
		domConstruct,
		FeatureModel,
		MemoryStore,
		ReferenceProvider,
		Feature,
		ShapeFactory,
		LayerType,
    MilitarySymbologyPainter,
    MIL_STD_2525b,
		MIL_STD_2525c,
		APP_6A,
		APP_6B,
		APP_6C,
		EditController,
		FeatureLayer,
		BasicFeaturePainter,
		FeaturePainter,
    AttributionComponent,
		SampleContextMenu,
		LayerConfigUtil,
		IconFactory,
		PointLabelPosition,
		SymbologyUtil,
    SymbologyPropertiesPanel,
    sample
	)
	{

	var map;
  var modelRef = ReferenceProvider.getReference("EPSG:4326");
  var currentSymbology = MIL_STD_2525b;
	var map_layers = {};
	var painted_points = [];
	var propertiesPanel;
	var jq_select;
	


  function createMilSymModel(ref, featureData) {
    var featureStore = new MemoryStore({
      data: featureData
    });
    return new FeatureModel(featureStore, {reference: ref});
  }

  function createMilSymPainter() {
    //#snippet milSymPaintBody
    var symbologyPainter = new MilitarySymbologyPainter(
        //The military standard this painter should paint.
        currentSymbology,
        {
          codeFunction: function(feature) {
            //We return the SIDC of the military symbol
            return feature.properties.code;
          },
          modifiers: function(feature) {
            //We return the modifiers in the properties of our feature.
            //These include both text modifiers and graphical modifiers, as defined
            //in the MS2525 and APP6 specifications.
            return feature.properties.modifiers;
          },
          style: function(feature) {
            //We return our style. Note that it is also possible to have feature-specific
            //styling if you choose to use the feature parameter.
            return {
              selectionColor: "#FF9900",
              affiliationColors: {
                "Friend": SymbologyUtil.FRIEND_COLOR,
                "Hostile": SymbologyUtil.HOSTILE_COLOR
              },
              lineWidth: 2,
              iconSize: feature.properties.iconSize ? feature.properties.iconSize : 64
            };
          },
          width: function(feature) {
            //We return the width we use for arrow-type tactical graphics.
            return feature.properties.width;
          },
          symbologyServicePath: "http://" + window.location.hostname + ":8081/symbologyservice/"
        });
    //#endsnippet milSymPaintBody

    return symbologyPainter;
  }
	
	function createMilSymLayer(featureModel, milSymLabel, id_disposito, color)
	{
		var original_color = color;
		color = color == '' ? '#' + Math.floor(Math.random()*16777215).toString(16) : color ;
		 var EVENT_STYLE = {
			draped: true,
			width: "16px",
			height: "16px",
			image: IconFactory.circle({
				width: 16,
				height: 16,
				fill: color,//"rgba(219, 205, 17, 0.8)",
				stroke: "rgba(0, 0, 0, 0.8)",
				strokeWidth: 1
			})
		};
	
		var EVENT_SELECTED_STYLE = {
			draped: true,
			width: "16px",
			height: "16px",
			image: IconFactory.circle({
				width: 16,
				height: 16,
				fill: "rgba(150, 25, 25, 0.8)",
				stroke: "rgba(255, 255, 255, 0.8)",
				strokeWidth: 1.5
			})
		};
	
		var labelPainter = new BasicFeaturePainter();
		
		/*labelPainter.getDetailLevelScales = function() {
      return [ 1 / 2000000 ];
    };*/

    labelPainter.paintLabel = function(labelcanvas, feature, shape, layer, map, paintState)
		{
			var label = "";
			if (paintState.selected)
			{
				label = (
					"<span style='color: rgba(150, 25, 25)'>" +
					"<b>"+
					feature.id +
					"</b>"+
					"<i>" +
					" (" +
					Math.round(feature.properties.modifiers.latitude*100)/100 +
					"," +
					Math.round(feature.properties.modifiers.longitude*100)/100 +
					")" +
					"</i>" +
					"</span>"
				);
			}
			else
			{
				label = (
					"<span style='color: #FFFFFF'>" +
					"<b>"+
					feature.id +
					"</b>"+
					"<i>" +
					" (" +
					Math.round(feature.properties.modifiers.latitude*100)/100 +
					"," +
					Math.round(feature.properties.modifiers.longitude*100)/100 +
					")" +
					"</i>" +
					"</span>"
				);
			}
      labelcanvas.drawLabel(
				label,
				shape.focusPoint,
				{
					positions: PointLabelPosition.SOUTH
				}
			);
    };
		
		labelPainter.paintBody = function(geocanvas, feature, shape, layer, map, paintState) {
      if (paintState.selected) {
        geocanvas.drawIcon(shape.focusPoint, EVENT_SELECTED_STYLE);
      } else {
        geocanvas.drawIcon(shape.focusPoint, EVENT_STYLE);
      }
    };
		
		var featureLayer = new FeatureLayer(featureModel,
		{
			id: id_disposito,
			layerType: LayerType.DYNAMIC,
			painter: labelPainter,
      selectable: true,
      editable: true,
      label: milSymLabel,
    });

    featureLayer.onCreateContextMenu = LayerConfigUtil.createContextMenu;

    return featureLayer;
	}

  function createTemplateForNewSymbol(symbologyNode, shape) {
    //Retrieve bounds to place the new symbol in the same position and with a similar size
    return (!shape.pointCount || shape.pointCount === 1) ?
      //If the old symbol was an icon, use 0.03 to render the new one with a similar size
           symbologyNode.createTemplate(shape.reference, shape.bounds.x, shape.bounds.y, 0.03) :
           symbologyNode.createTemplate(shape.reference, shape.bounds.x, shape.bounds.y,
               shape.bounds.height > shape.bounds.width ? shape.bounds.height : shape.bounds.width);
  }

  /**
   * Checks whether either the new or the old symbol is an icon.
   */
  function isIconInvolved(symbologyShape, featureShape) {
    return (!featureShape.pointCount || featureShape.pointCount === 1 || !symbologyShape.pointCount ||
            symbologyShape.pointCount === 1);
  }

  /**
   * Checks whether the pointCount constraints are broken for the new symbol.
   * If so, we should use the new symbol template.
   */
  function breakPointCountConstraints(symbologyNode, featureShape) {
    return ((featureShape.pointCount > symbologyNode.maximumPointCount && symbologyNode.maximumPointCount !== -1) ||
            (featureShape.pointCount < symbologyNode.minimumPointCount && symbologyNode.minimumPointCount !== -1));
  }

	function initializeMapWithAjax()
	{
		//console.log('initializeMapWithAjax');
      getPointsByAjax(
        function(data_points){
          //Inicialize map
					new SampleContextMenu(map);
					//Center map in a point
          map.mapNavigator.fit(ShapeFactory.createBounds(modelRef, [-105.25, 10.4, 20.30, 0.15]));
					var layers = {};
          for(var p = 0; p<data_points.length;p++)
					{
						var data_p = data_points[p];
						//var id = data_p["id"];
						var dispositivo_id = data_p["dispositivo_id"] + '';
						var name = data_p["name"] + '';
						//var latitude = data_p["latitude"];
						//var longitude = data_p["longitude"];
						var color = data_p["color"];
						var feature = data_p["Feature"];
						//Ya existe la capa
						if (dispositivo_id in layers)
						{
							layers[dispositivo_id].features.push(feature);
						}
						//No existe la capa
						else
						{
							layers[dispositivo_id] =
							{
								'id': dispositivo_id,
								'name': name,
								'features': [feature],
								'color': color,
							};
						}
					}
					LayerConfigUtil.addLonLatGridLayer(map);
					//Create Layers
					for (var key in layers)
					{
						var points = [];
						points = layers[key].features;
					
						var featureModel = createMilSymModel(modelRef, points);
						var newLayer = createMilSymLayer(featureModel, layers[key].name, layers[key].id, layers[key].color);
						
						map_layers[layers[key].id] = newLayer;

						map.layerTree.addChild(newLayer);
						
					}
					painted_points = data_points;
					
					//////////////////////////////////////////
					//Select dispositivo
					var jq_panel_layers = $( ".layerTreePanel" ) ;
					var jq_div_select = $('<div>');
					jq_select = $('<select>');
					jq_select.prop("id", 'select_dispositivo');
					jq_select.addClass("selectDispositivo");
					jq_select.empty().append(
					$(
						'<option>',
							{
									value: 0,
									text: 'Todos los dispositivos'
							}
						)
					);
					
					for (var key in layers)
					{
						//Getting row info
						jq_select.append(
							$(
							'<option>',
								{
									value: layers[key].id,
									text: layers[key].name
								}
							)
						);
					}
					
					jq_div_select.append(jq_select);
					jq_select.val('0');
					jq_panel_layers.prepend(jq_div_select);
					
					jq_select.change(
						function () {
							if (jq_select.val() == '0')
							{
									for (var key in map_layers)
									{
										map_layers[key].visible = true;
									}
							}
							else
							{
								for (var key in map_layers)
								{
									if (jq_select.val() == key)
									{
										map_layers[key].visible = true;
									}
									else
									{
										map_layers[key].visible = false;
									}
								}
							}
						}
					);
					////////////////////////////////
					
					//Panel properties
					propertiesPanel = new SymbologyPropertiesPanel("propertiesPanel");
					propertiesPanel.startup();
					
					domConstruct.place(propertiesPanel.domNode, dom.byId("propertiesPanelInternalDiv"), "last");
					propertiesPanel.setMilitarySymbol(null, null);
					
					var clickHandle;
					
					map.on('SelectionChanged', function()
					{
						
						if (map.selectedObjects.length !== 1 || map.selectedObjects[0].selected.length !== 1)
						{
							propertiesPanel.updateModifiers();
							//detach listeners.
							propertiesPanel.onSymbolChanged = Function.prototype;
							propertiesPanel.onModifierUpdated = Function.prototype;
							propertiesPanel.setMilitarySymbol(null, null);
							return;
						}
						var featureToEdit = map.selectedObjects[0].selected[0];
						var layerToEdit = map.selectedObjects[0].layer;
						
						propertiesPanel.onSymbolChanged = function(event)
						{
							propertiesPanel.updateModifiers();
							var newMilitarySymbol = event.symbol;
					
							// Save changes before changing the symbol
							featureToEdit.properties.code = newMilitarySymbol.code;
							featureToEdit.properties.modifiers = newMilitarySymbol.textModifiers;
					
							var symbologyNode = featureToEdit.properties.symbology.getSymbologyNode(newMilitarySymbol.code);
							var symbologyShape = null;
							if (symbologyNode.supportsShapeType(featureToEdit.shape.type)) {
								symbologyShape = featureToEdit.shape;
							} else {
								symbologyShape = createTemplateForNewSymbol(symbologyNode, featureToEdit.shape);
							}
					
							if (isIconInvolved(symbologyShape, featureToEdit.shape) ||
									breakPointCountConstraints(symbologyNode, featureToEdit.shape)) {
								// If either one of the symbols is an icon or the point count constraints are not compatible then
								// use the new symbol template
								featureToEdit.shape = symbologyShape;
							}
					
							layerToEdit.model.store.put(featureToEdit);
							propertiesPanel.setMilitarySymbol(featureToEdit.properties.symbology, featureToEdit.properties.code, featureToEdit.properties.modifiers);
							layerToEdit.painter.invalidate(featureToEdit);
						};
					
						propertiesPanel.onModifierUpdated = function(event)
						{
							featureToEdit.properties.code = event.symbol.code;
							featureToEdit.properties.modifiers = event.symbol.textModifiers;
							layerToEdit.painter.invalidate(featureToEdit);
						};
						
						propertiesPanel.setMilitarySymbol(featureToEdit.properties.symbology, featureToEdit.properties.code, featureToEdit.properties.modifiers);
					
						clickHandle && clickHandle.remove();

					});
					
        }
      );

    }
		
		function getIndexPaintPoint(id, dispositivo_id)
		{
			for(var q = 0; q<painted_points.length;q++)
			{
				var data_pp = painted_points[q];
				var id_pp = data_pp["id"];
				var dispositivo_id_pp = data_pp["dispositivo_id"] + '';
				if (id == id_pp && dispositivo_id == dispositivo_id_pp)
				{
					return q;
				}
			}
			return -1;
		}
		
		function updateMapWithAjax(){
      getPointsByAjax(
        function(data_points){
          //Update map
					//console.log("updateMapWithAjax: ");
					
					var update_points = [];
					var remove_points = [];
					
					for(var p = 0; p<painted_points.length;p++)
					{
						var data_p = painted_points[p];
						var id = data_p["id"];
						var dispositivo_id = data_p["dispositivo_id"] + '';
						//var name = data_p["name"] + '';
						var latitude = data_p["latitude"];
						var longitude = data_p["longitude"];
						//var feature = data_p["Feature"];
						
						var in_db = false;
						for(var pp = 0; pp<data_points.length;pp++)
						{
							var data_pp = data_points[pp];
							var id_pp = data_pp["id"];
							var dispositivo_id_pp = data_pp["dispositivo_id"] + '';
							var latitude_pp = data_pp["latitude"];
							var longitude_pp = data_pp["longitude"];
							if (id == id_pp && dispositivo_id == dispositivo_id_pp)
							{
								in_db = true;
								if (latitude != latitude_pp || longitude != longitude_pp )
								{
									//update
									update_points.push(data_pp);
								}
							}
						}
						if (in_db == false)
						{
							//remove
							remove_points.push(data_p);	
						}
					}
					
					var add_points = [];
					
					for(var pp = 0; pp<data_points.length;pp++)
					{
						var data_pp = data_points[pp];
						var id_pp = data_pp["id"];
						var dispositivo_id_pp = data_pp["dispositivo_id"] + '';
						
						var is_painted = false;
						for(var p = 0; p<painted_points.length;p++)
						{
							var data_p = painted_points[p];
							var id = data_p["id"];
							var dispositivo_id = data_p["dispositivo_id"] + '';
							if (id == id_pp && dispositivo_id == dispositivo_id_pp)
							{
								is_painted = true;
							}
						}
						if (is_painted == false)
						{
							//add
							add_points.push(data_pp);
						}
					}
					
					//Update points
					for(var p = 0; p<update_points.length;p++)
					{
						console.log("Actualizando: " + update_points.length );
						var point_update = update_points[p];
						var id = point_update["id"];
						var dispositivo_id = point_update["dispositivo_id"] + '';
						var latitude = point_update["latitude"];
						var longitude = point_update["longitude"];
						
						var pointCopy = map_layers[dispositivo_id].model.get(id);//.copy();
						pointCopy.shape.move2D(longitude, latitude);
						pointCopy.properties.modifiers.latitude = latitude;
						pointCopy.properties.modifiers.longitude = longitude;
						map_layers[dispositivo_id].model.put(pointCopy);
						
						//Change the position
						var index = getIndexPaintPoint(id, dispositivo_id);
						if (index != -1)
						{
							painted_points[index].longitude = longitude;
							painted_points[index].latitude = latitude;
							painted_points[index].Feature = pointCopy;
						}
						
						if ( map.selectedObjects && map.selectedObjects.length)
						{
							var featureToEdit = map.selectedObjects[0].selected[0];
							if (featureToEdit.id == pointCopy.id )
							{
								var layerToEdit = map.selectedObjects[0].layer;
								layerToEdit.model.store.put(featureToEdit);
								propertiesPanel.setMilitarySymbol(featureToEdit.properties.symbology, featureToEdit.properties.code, featureToEdit.properties.modifiers);
								layerToEdit.painter.invalidate(featureToEdit);
							}
						}
					}
					
					//Add points
					for(var p = 0; p<add_points.length;p++)
					{
						console.log("Agregando: " + add_points.length );
						
						var point_add = add_points[p];
						var id = point_add["id"];
						var name = point_add["name"] + '';
						var dispositivo_id = point_add["dispositivo_id"] + '';
						var latitude = point_add["latitude"];
						var longitude = point_add["longitude"];
						var feature = point_add["Feature"];
						var color = point_add["color"];
						
						var index = getIndexPaintPoint(id, dispositivo_id);
						if (index == -1)
						{
							if (dispositivo_id in map_layers)
							{
								//Exists the layers
								map_layers[dispositivo_id].model.put(feature);
								painted_points.push(point_add);
							}
							else
							{
								var points = [feature];
							
								var featureModel = createMilSymModel(modelRef, points);
								var newLayer = createMilSymLayer(featureModel, name, dispositivo_id, color);
								map_layers[dispositivo_id] = newLayer;
								map.layerTree.addChild(newLayer);
								
								jq_select.append(
									$(
									'<option>',
										{
											value: dispositivo_id,
											text: name
										}
									)
								);
								
							}
						}
					}
					
					//Remove points
					for(var p = 0; p<remove_points.length;p++)
					{
						console.log("Removiendo: " + remove_points.length );
						var point_remove= remove_points[p];
						var id = point_remove["id"];
						var dispositivo_id = point_remove["dispositivo_id"] + '';
						var feature = point_remove["Feature"];

						var index = getIndexPaintPoint(id, dispositivo_id);
						if (index != -1)
						{
							map_layers[dispositivo_id].model.remove(id);
							painted_points.splice(index, 1);
						}
					}
					
        }
      );
    }
    
    function getPointsByAjax(funct_show_points)
		{
      $.ajax(
        {
          'type': 'POST',
          'async': false,
          'url': "http://localhost:8888/select",
					//'url': "http://adria.inaoep.mx:6475/select",
          'dataType': "jsonp",
          'contentType': "application/json",
          //'data': JSON.stringify(
          //    {
          //        'id': 1
          //    }
          //),
          'success': function (response) {
              //Get the points from the response
							var data_points = [];
              for(var r=0;r<response.length;r++){
                var p = ShapeFactory.createPoint(modelRef, [response[r].longitude, response[r].latitude]);
								var f_feature = new Feature(
									p,
									{
										"code" : "SFSACMMS-------",
										"symbology": currentSymbology,
										"modifiers": {
											nombre: response[r].id,
											dispositivo_id: response[r].nombre,
											latitude : response[r].latitude,
											longitude : response[r].longitude,
										}
									},
									response[r].id
								);
								
								var json = null;
								var color = '';
								if (response[r].dispositivo_opciones)
								{
									json = JSON.parse(response[r].dispositivo_opciones);
									if(json.color)
									{
										color = json.color;
									}
								}
								var point = {};
								point["id"] = response[r].id;
								point["dispositivo_id"] = response[r].dispositivo_id;
								point["name"] = response[r].nombre;
								point["latitude"] = response[r].latitude;
								point["longitude"] = response[r].longitude;
								point["color"] = color;
								point["Feature"] = f_feature;
								data_points.push(point);
              }
              funct_show_points(data_points);
            },
            'error': function(jqXHR, exception)
            {
              console.log('error '+ jqXHR.status);
            }
        }
      );   
    }

  LayerConfigUtil.createBingLayer({type: "Aerial"})
      .then(function(bingLayer) {
        map = sample.makeMap({reference: ReferenceProvider.getReference("EPSG:900913")},
            {includeBackground: false});
        map.layerTree.addChild(bingLayer, "bottom");
        new AttributionComponent(map, {displayNode: "attribution"});
        //initializeMap(map);
				initializeMapWithAjax();
      }, function(error) {
        LayerConfigUtil.createBackgroundLayer().then(function(bgLayer) {
          map = sample.makeMap({reference: bgLayer.model.reference},
              {includeBackground: false});
          map.layerTree.addChild(bgLayer, "bottom");
          //initializeMap(map);
					initializeMapWithAjax();
        });
      });
	//Update the every * milliseconds
	var id_terval;
	var interval = 5000;
	var refresh = function()
	{
			updateMapWithAjax();
			//interval += 1000;
			id_terval = setTimeout(refresh,interval);
	}
	id_terval = setTimeout(refresh,interval);
});