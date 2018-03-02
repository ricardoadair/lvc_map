define([
], function() {

  var SPLIT_REG_EX = /,| /; // split on commas or spaces. We put this in a var to avoid recompiling the expression.

  /**
   * Retrieves all possible symbols for a symbology
   * @param symbology the symbology to get all symbols for
   * @return array of {id, name}
   */
  function getAllSymbols(symbology) {
    var symbolsArraySFCT = [];
    var namesSetSFCT = {};
    var duplicatesMapSFCT = [];
    getAllSymbolsSFCT(symbology, symbology.symbologyRoot, symbolsArraySFCT, namesSetSFCT, duplicatesMapSFCT);
    return symbolsArraySFCT;
  }

  function getAllSymbolsSFCT(symbology, node, symbolsArraySFCT, namesSetSFCT, duplicatesMapSFCT) {
    if (node.code !== null) {
      var displayName = node.name;
      var parent = node.parent;
      // always try to add one parent
      if (parent) {
        displayName = addParentName(displayName, parent.name);
        parent = parent.parent;
      }
      // clarify when needed
      while(namesSetSFCT[displayName] && parent) {
        displayName = addParentName(displayName, parent.name);
        parent = parent.parent;
      }
      symbolsArraySFCT.push({id: node.code, name: displayName});
      namesSetSFCT[displayName] = true;
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        getAllSymbolsSFCT(symbology, node.children[i], symbolsArraySFCT, namesSetSFCT, duplicatesMapSFCT);
      }
    }
  }

  function addParentName(childName, parentName) {
    if (parentName === null) {
      return childName;
    }

    // replace words that are common in the parent
    var parentWords = parentName.split(SPLIT_REG_EX);
    var childWords = childName.split(SPLIT_REG_EX);
    var trimmedChildName = "";
    for ( var i=0;i<parentWords.length || i<childWords.length;i++ ) {
      if ( i >= parentWords.length ) {
        trimmedChildName += childWords[i] + " ";
      } else if ( i < childWords.length && !(parentWords[i] === childWords[i]) ) {
        trimmedChildName += childWords[i] +  " ";
      }
    }
    if ( trimmedChildName.indexOf( " ," ) === 0 ) {
      trimmedChildName = trimmedChildName.replace( ", ", "" );
    }
    if ( trimmedChildName.indexOf( "- " ) === 0) {
      trimmedChildName = trimmedChildName.replace( "- ", "" );
    }
    trimmedChildName = parentName + " - " + trimmedChildName;
    return trimmedChildName.trim();
  }

  return {
    HOSTILE_COLOR: "#FF8080",
    FRIEND_COLOR: "rgb(128, 224, 255)",
    getAllSymbols: getAllSymbols
  };
});