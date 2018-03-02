define([
  "dojo/_base/connect",
  "./SymbologyUtil",
  "dojo/_base/declare",
  "dojo/dom",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_Templated",
  "dijit/_WidgetsInTemplateMixin",
  "luciad/symbology/military/MilitarySymbol",
  "dojo/text!samples/lvc_map/templates/SymbologyPropertiesPanel.html",
  //widgets in template
  "dijit/form/FilteringSelect"
], function(dConnect, SymbologyUtil, declare, dDom, dDomStyle, _WidgetBase, _Templated, _WidgetsInTemplateMixin,
            MilitarySymbol, Template) {

  //Some properties that can be configured in this panel.

  // Properties whose possible values can be enumerated.
  var COMBO_BOX_PROPERTY_KEYS = [];
  // Properties whose possible values cannot be enumerated.
  var TEXT_BOX_PROPERTY_KEYS = ["nombre", "dispositivo_id", "latitude", "longitude"];
	//var COMBO_BOX_PROPERTY_KEYS = ["sector1", "sector2", "affiliation", "standardIdentity1", "standardIdentity2", "status", "country", "orderOfBattle", "hqTaskForceDummy", "echelon", "mobility"];
  //var TEXT_BOX_PROPERTY_KEYS = ["uniqueDesignation", "additionalInformation", "movementDirection"];
  /**
   * A property panel for the modification of new military icons and tactical graphics properties
   */
  return declare([_WidgetBase, _Templated, _WidgetsInTemplateMixin], {

    templateString: Template,
    widgetsInTemplate: true,

    constructor: function(containerName) {
      this._containerName = containerName || "propertiesPanel";
      this._militarySymbol = null;
    },

    postCreate: function() {
      var i;
      for (i = 0; i < COMBO_BOX_PROPERTY_KEYS.length; i++) {
        var propertyForm = this[COMBO_BOX_PROPERTY_KEYS[i]];
        this._setOnChangeCallback(this, propertyForm, COMBO_BOX_PROPERTY_KEYS[i]);
      }

      for (i = 0; i < TEXT_BOX_PROPERTY_KEYS.length; i++) {
        var propertyForm = this[TEXT_BOX_PROPERTY_KEYS[i]];
        this._setOnChangeCallback(this, propertyForm, TEXT_BOX_PROPERTY_KEYS[i]);
      }
    },

    _setOnChangeCallback: function(self, propertyForm, property) {
      dConnect.connect(propertyForm, "onChange", function(newValue) {
        if (self._militarySymbol) {
          self._updateProperty(property, newValue);
        }
      });
    },

    /**
     * Configures this panel to modify a military symbol. If any of the given parameters
     * is null, the panel is hidden. If the panel was hidden before, it will become
     * visible after this call.
     * @param symbology the symbology standard
     * @param code the code to initialize the panel for
     * @param modifiers the applicable modifiers
     */
    setMilitarySymbol: function(symbology, code, modifiers) {
      var containerNode = dDom.byId(this._containerName);
      if (!code) {//If any of the given parameters is null, we reset the option fields
        this._militarySymbol = null;
        if (containerNode) {
          dDomStyle.set(containerNode, "display", "none");
        }
      } else {
        this._militarySymbol = new MilitarySymbol(symbology, code, modifiers);
        if (containerNode) {
          dDomStyle.set(containerNode, "display", "");
        }
      }

      // update combo-boxes
      var i;
      for (i = 0; i < COMBO_BOX_PROPERTY_KEYS.length; i++) {
        this.setComboBoxProperty(COMBO_BOX_PROPERTY_KEYS[i]);
      }

      //update text-boxes
      for (i = 0; i < TEXT_BOX_PROPERTY_KEYS.length; i++) {
        this.setTextBoxProperty(TEXT_BOX_PROPERTY_KEYS[i]);
      }

      this.setSymbolComboBoxProperty(symbology);
    },

    /**
     * Fills the combo-box with all possible military code values for the given symbology
     * @param symbology a symbology
     */
    setSymbolComboBoxProperty: function(symbology) {
      var symbolContainer = dDom.byId(this.symbolContainer);
			if (symbolContainer) {
				if ((!symbology)) {
					dDomStyle.set(symbolContainer, "display", "none");
				}
				if (symbology) {
					var symbols = SymbologyUtil.getAllSymbols(symbology);
					var symbolStore = this.symbol.store;
					symbolStore.setData(symbols);
					//Because changing the various properties of a military symbol also changes its code, we
					//get the normalized code from the symbology node to set as the value of the symbol.
					this.symbol.set('value', symbology.getSymbologyNode(this._militarySymbol.code).code);
					dDomStyle.set(symbolContainer, "display", "");
				}
			}
    },

    getCode: function() {
      return this._militarySymbol.code;
    },

    /**
     * Fills a combo-box with all possible values for a chosen property. It also handles the visibility of
     * the property in the panel, hiding it when it's not applicable.
     *
     * @param property the property (for example "affiliation")
     */
    setComboBoxProperty: function(property) {
      if (!this[property]) {
        return;
      }

      var propertyContainer = this[property + "Container"];
      var isApplicableProperty = this._isApplicableProperty(property);
      var propertyPossibleValues = isApplicableProperty ? this._militarySymbol.possibleValues(property) || [] : [];
      if (isApplicableProperty && propertyPossibleValues.length > 0) {
        var formData = [];
        for (var i = 0; i < propertyPossibleValues.length; i++) {
          formData[i] = {id: propertyPossibleValues[i] ? propertyPossibleValues[i] : "Undefined"};
        }

        var inputStore = this[property].store;
        inputStore.setData(formData);
        this[property].set('value', this._militarySymbol[property] ? this._militarySymbol[property] : "");
        dDomStyle.set(propertyContainer, "display", "");
      } else {
        dDomStyle.set(propertyContainer, "display", "none");
      }
    },

    /**
     * Fills a text-box with the current value of the given textual property in a military symbol.
     * It also handles the visibility of the property in the panel, hiding it when it's not applicable.
     *
     * @param property the property (for example "uniqueDesignation")
     */
    setTextBoxProperty: function(property) {		
      if (!this[property]) {
        return;
      }
      var propertyContainer = this[property + "Container"];
			if(propertyContainer !== undefined)
      {
				if (this[property]){ //&& this._isApplicableProperty(property)) {
					var textBox = this[property];
					if (this._militarySymbol)
					{
						if (this._militarySymbol[property])
						{
							textBox.set("value", this._militarySymbol[property] ? this._militarySymbol[property] : "");
						}
						else if (this._militarySymbol._textModifiers[property])
						{
							textBox.set("value", this._militarySymbol._textModifiers[property] ? this._militarySymbol._textModifiers[property] : "");
						}
						else
						{
							textBox.set("value", "");
						}
					}
					dDomStyle.set(propertyContainer, "display", "");
				} else {
					dDomStyle.set(propertyContainer, "display", "none");;
				}
			}
    },

    /**
     * It checks if a certain property is applicable for the current military symbol
     * @param property
     */
    _isApplicableProperty: function(property) {
      return this._militarySymbol && this._militarySymbol.hasOwnProperty(property);
    },

    /**
     * This method is called when the symbol combo-box has changed value
     * This method was configured in SymbologyPropertiesPanel.html and reacts to change events.
     * @param newValue the new military code chosen in the combo-box
     */
    _symbolSelect: function(newValue) {
      if (!newValue || !this._militarySymbol) {
        return;
      }

      var newMilitarySymbol = this._militarySymbol.copyAndChangeCode(newValue);
      if(this._militarySymbol.code !== newMilitarySymbol.code) {
        this.emit('SymbolChanged', {
          symbol: newMilitarySymbol
        });
      }
    },

    /**
     * Sets the value of the given property to the new value.
     * @param property the property to update
     * @param newValue the new value of the property
     */
    _updateProperty: function(property, newValue) {
      this._militarySymbol[property] = newValue;
      this.emit('ModifierUpdated', {
        symbol: this._militarySymbol
      });
    },

    /**
     * This method is called when the properties panel is about to be hidden to update the corresponding
     * properties if the onChange method wasn't called (text-boxes).
     */
    updateModifiers: function() {
      var textBox, i;
      if (this._militarySymbol) {  // If the object is a cluster we do not need to update any property
        for (i = 0; i < TEXT_BOX_PROPERTY_KEYS.length; i++) {
          textBox = this[TEXT_BOX_PROPERTY_KEYS[i]];
          this._updateProperty(TEXT_BOX_PROPERTY_KEYS[i], textBox.get("value"));
        }
      }
    }
  });
});


