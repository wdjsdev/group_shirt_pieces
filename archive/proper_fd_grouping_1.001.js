/*

Script Name: Proper_FD_Grouping
Author: William Dowling
Build Date: 29 December, 2016
Description: Run through each size/piece of a converted template and dig recursively to the bottom and 
	group all "production information" and "color blocks" stuff together properly.
Build number: 1.0

Progress:

	Version 1.001
		29 December, 2016
		

*/

function container()
{

	/*****************************************************************************/

	///////Begin/////////
	///Logic Container///
	/////////////////////

	//sendErrors Function Description
	//Display any errors to the user in a preformatted list
	function sendErrors(errorList)
	{
		var localValid = true;
	
		alert(errorList.join("\n"));
	
	
		return localValid
	}

	function loopSizes(lay)
	{
		for(var a=0;a<lay.layers.length;a++)
		{
			var thisSize = lay.layers[a];
			lib["curSize"] = thisSize.name;
			lib[thisSize.name] = {};
			for(var b=0;b<thisSize.groupItems.length;b++)
			{
				var thisShirtPiece = thisSize.groupItems[b];
				lib["curGroup"] = thisShirtPiece;
				lib[thisSize.name][thisShirtPiece.name] = {};
				lib[thisSize.name][thisShirtPiece.name]["prod"] = tempLay.groupItems.add();
				lib[thisSize.name][thisShirtPiece.name]["prod"].name = thisShirtPiece.name + " prod group";
				lib[thisSize.name][thisShirtPiece.name]["art"] = tempLay.groupItems.add();
				lib[thisSize.name][thisShirtPiece.name]["art"].name = thisShirtPiece.name + " art group";
				checkPaths(thisShirtPiece);
			}
			
		}
	}


	//checkPaths Function Description
	//check each pathItem in this particular group to find out whether it's a color block or production info
	//place into appropriate group
	//if any groups exist, call this same function recursively until there are no groups left
	function checkPaths(thisGroup)
	{
		var blah = lib;
		
		for(var c=0;c<thisGroup.pageItems.length;c++)
		{
			var thisItem = thisGroup.pageItems[c];

			//PathItem
			//PathItem
			//PathItem
			if(thisItem.typename == "PathItem")
			{
				var dest = getDest(thisItem);
				thisItem.moveToEnd(lib[dest]);
			}


			//CompoundPathItem
			//CompoundPathItem
			//CompoundPathItem
			//All internal components of a compoundPathItem have the same color properties
			//Just take the first pathItem and determine it's color props
			else if(thisItem.typename == "CompoundPathItem")
			{
				if(thisItem.pathItems.length>0)
				{
					getDest(thisItem.pathItems[0])
				}
			}


			//GroupItem
			//GroupItem
			//GroupItem
			else if(thisItem.typename == "GroupItem")
			{
				checkPaths(thisItem); 
			}
		}
	}



	//getDest Function Description
	//check the path's color properties and determine whether it belongs in
	//the prod group or the art group
	function getDest(path)
	{
		var result;
		var isProd = false;
		var isArt = false;

		//check fill color
		var fillType = path.fillColor.typename;
		$.writeln(fillType);

		switch(fillType)
		{
			case "SpotColor" :
				var fillName = path.fillColor.spot.name.toLowerCase();
				for(var fc=0;fc<lib["prodColors"].length;fc++)
				{
					var thisProdColor = lib["prodColors"][fc];
					if(fillName == thisProdColor)
					{
						isProd = true;
					}
				}
				if(lib["artColorsRegEx"].test(fillName))
				{
					isArt = true;
				}
		}

		//check stroke color
		var strokeType = path.strokeColor.typename;

		switch(strokeType)
		{
			case "SpotColor" :
				var strokeName = path.strokeColor.spot.name.toLowerCase();
				checkColor(strokeName,"prodColors");
				for(var sc=0;sc<lib["prodColors"].length;sc++)
				{
					var thisProdColor = lib["prodColors"][sc];
					if(strokeName == thisProdColor)
					{
						isProd = true;
					}
				}
				if(lib["artColorsRegEx"].test(strokeName))
				{
					isArt = true;
				}
		}

		if(isProd)
		{
			result = lib[lib["curSize"]]
		}

	}

	//checkColor Function Description
	//loop the lib arrays to see if color is either art or prod color
	function checkColor(itemColor,colorArray)
	{
		var result = false;

		for(var ac=0;ac<lib[colorArray].length;ac++)
		{
			var thisColor = lib[colorArray][ac];
			if(thisColor == itemColor)
			{
				result = true;
			}
		}
		return result;
	}




	////////End//////////
	///Logic Container///
	/////////////////////

	/*****************************************************************************/

	///////Begin////////
	////Data Storage////
	////////////////////

	var lib = 
	{
		"prodColors" : ["cut line", "cutline", "sewline", "sew line", "thru-cut", "jock tag b", "info b"],
		"artColors" : ["collar b", "collar 2 b", "collar info b", "boombah logo b", "boombah logo 2 b"],
		"artColorsRegEx" : /c[0-9]{1,2}/i,
		"curSize" : "",
		"curGroup" : ""

	}


	////////End/////////
	////Data Storage////
	////////////////////

	/*****************************************************************************/

	///////Begin////////
	///Function Calls///
	////////////////////

	var docRef = app.activeDocument;
	var layers = docRef.layers;
	var aB = docRef.artboards;
	var swatches = docRef.swatches;
	var ppLay = layers[0].layers["Prepress"];


	var valid = true;

	var tempLay = docRef.layers.add();
	tempLay.name = "temp";

	valid = loopSizes(ppLay);

	tempLay.remove();


	////////End/////////
	///Function Calls///
	////////////////////

	/*****************************************************************************/

	if(errorList.length>0)
	{
		sendErrors(errorList);
	}
	return valid

}
container();