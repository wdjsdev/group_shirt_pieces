/*

Script Name: Proper_FD_Grouping
Author: William Dowling
Build Date: 29 December, 2016
Description: Run through each size/piece of a converted template and dig recursively to the bottom and 
	group all "production information" and "color blocks" stuff together properly.
Build number: 1.0

Progress:

	Version 1.001 & 1.002
		29 December, 2016
		Initial build and testing

	Version 1.003
		03 January, 2017
		Adding compound path fixer function to allow compound paths to be accurately placed in the appropriate group
		Adding makeSubGroups function to group items in artGroup or prodGroup by their color
			i.e. take all the "CUT LINE" pieces and group them together.
		Working properly to fix all compound paths and create appropriate art/prod groups as well as subgroups by color
		Next version will attempt to optimize compound path fixes. hopefully that will dramatically speed up the process.

	Version 1.004
		05 January, 2017
		Attempting to optimize fixCompoundPaths function for better performance.
		Cut processing time by 99.8% by being more selective about which compound paths to fix.
		


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

	function fixCompoundPaths()
	{
		var cPaths = docRef.compoundPathItems;
		var start = new Date().getTime();
		for(var a=0;a<cPaths.length;a++)
		{
			var thisCPath = cPaths[a];
			if(thisCPath.layer.parent.name == "Prepress" && thisCPath.pathItems.length == 0)
			{
				docRef.selection = null;
				thisCPath.selected = true;
				app.executeMenuCommand("noCompoundPath");
				app.executeMenuCommand("ungroup");
				app.executeMenuCommand("ungroup");
				app.executeMenuCommand("ungroup");
				app.executeMenuCommand("compoundPath");
			}
		}
		var end = new Date().getTime();
		var duration = end - start;
		$.writeln("fixCompoundPaths function took " + duration + " milliseconds.");
	}

	function loopSizes(lay)
	{
		for(var a=0;a<lay.layers.length;a++)
		{
			var thisSize = lay.layers[a];
			$.writeln("beginning size loop " + a + " : which is " + thisSize.name);
			lib["curSize"] = thisSize.name;
			lib[thisSize.name] = {};
			for(var b = thisSize.groupItems.length-1;b >-1; b--)
			{
				var thisShirtPiece = thisSize.groupItems[b];
				var pieceName = thisShirtPiece.name;
				$.writeln("beginning piece loop " + b + " : which is " + pieceName);
				lib["curGroup"] = thisShirtPiece;
				lib["artGroup"] = tempLay.groupItems.add();
				lib["artGroup"].name = "Artwork";
				lib["prodGroup"] = tempLay.groupItems.add();
				lib["prodGroup"].name = "Prod Info";

				checkPaths(thisShirtPiece);
				if(lib["artGroup"].pageItems.length>0)
				{
					makeSubGroups(lib["artGroup"]);
					lib["artGroup"].moveToBeginning(lib["curGroup"]);
				}
				else
				{
					lib["artGroup"].remove();
				}
				if(lib["prodGroup"].pageItems.length>0)
				{
					makeSubGroups(lib["prodGroup"]);
					lib["prodGroup"].moveToBeginning(lib["curGroup"]);
				}
				else
				{
					lib["prodGroup"].remove();
				}

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
		
		for(var c = thisGroup.pageItems.length-1;c >-1; c--)
		{
			var thisItem = thisGroup.pageItems[c];

			//PathItem
			//PathItem
			//PathItem
			if(thisItem.typename == "PathItem")
			{
				var dest = getDest(thisItem);
				thisItem.moveToBeginning(dest);
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
					var dest = getDest(thisItem.pathItems[0])
					thisItem.moveToBeginning(dest)
				}
				else
				{
					docRef.selection = null;
					thisItem.selected = true;
					app.executeMenuCommand("noCompoundPath");
					var dest = getDest(thisItem.pathItems[0]);
					thisItem.moveToBeginning(dest);
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

		switch(fillType)
		{
			case "SpotColor" :
				if(path.filled == false)
				{
					break;
				}
				var fillName = path.fillColor.spot.name.toLowerCase();
				if(checkColor(fillName,lib["prodColors"]))
				{
					isProd = true;
				}
				else if(lib["artColorsRegEx"].test(fillName))
				{
					isArt = true;
				}
				else if(checkColor(fillName,lib["artColors"]))
				{
					isArt = true;
				}
				break;

			case "CMYKColor" :
			case "RBGColor" :
			case "PatternColor" :
			case "GrayColor" :
			case "LabColor" :
			case "GradientClor" :
				wrongColors = true;
				wrongColorCounter++;
				break;
		}

		//check stroke color
		var strokeType = path.strokeColor.typename;

		switch(strokeType)
		{
			case "SpotColor" :
				if(path.stroked == false)
				{
					break;
				}
				var strokeName = path.strokeColor.spot.name.toLowerCase();
				if(checkColor(strokeName,lib["prodColors"]))
				{
					isProd = true;
				}
				else if(lib["artColorsRegEx"].test(strokeName))
				{
					isArt = true;
				}
				else if(checkColor(strokeName,lib["artColors"]))
				{
					isArt = true;
				}
				break;

			case "CMYKColor" :
			case "RBGColor" :
			case "PatternColor" :
			case "GrayColor" :
			case "LabColor" :
			case "GradientClor" :
				wrongColors = true;
				wrongColorCounter++;
				break;

		}

		if(isProd)
		{
			result = lib["prodGroup"];
		}
		else if(isArt)
		{
			result = lib["artGroup"];
		}
		else if(!isArt && !isProd)
		{
			result = lib["wrongPaths"];
		}

		return result;

	}

	//checkColor Function Description
	//loop the lib arrays to see if color is either art or prod color
	function checkColor(itemColor,colorArray)
	{
		var pat = new RegExp(itemColor,"g");
		var result = pat.test(colorArray)
		
		return result;
	}



	//makeSubGroups Function Description
	//loop all the items of thisGroup and put into sub groups based on colors
	function makeSubGroups(thisGroup)
	{
		var localValid = true;
	
		var subGroups = {};

		// for(var sg=0;sg<thisGroup.pageItems.length;sg++)
		while(thisGroup.pageItems.length>0)
		{
			// var thisItem = thisGroup.pageItems[sg];
			var thisItem = thisGroup.pageItems[0];

			var thisColor = getColor(thisItem);

			subGroups[thisColor] = tempLay.groupItems.add();
			subGroups[thisColor].name = thisColor;

			//established a group for thisColor, now loop the rest of the items to find the like colored items
			for(var sc = thisGroup.pageItems.length-1;sc > 0; sc--)
			{
				var thisItemCompare = thisGroup.pageItems[sc];
				var thisCompareColor = getColor(thisItemCompare);
				if(thisCompareColor == thisColor)
				{
					thisItemCompare.moveToBeginning(subGroups[thisColor]);
				}
			}
			thisItem.moveToBeginning(subGroups[thisColor]);
		}
	
	
		for(var prop in subGroups)
		{
			var biggest = subGroups[prop];

			subGroups[prop].moveToEnd(thisGroup);
		}



		//getColor Function Description
		//get the fill or stroke color of the passed item and return that color
		function getColor(thisItem)
		{
			var thisColor;
			switch(thisItem.typename)
			{
				case "PathItem" :
					if(thisItem.filled)
					{
						thisColor = thisItem.fillColor.spot.name;
					}
					else if(thisItem.stroked)
					{
						thisColor = thisItem.strokeColor.spot.name;
					}
					break;
				case "CompoundPathItem" :
					var firstItem = thisItem.pathItems[0];
					if(firstItem.filled)
					{
						thisColor = firstItem.fillColor.spot.name;
					}
					else if(firstItem.stroked)
					{
						thisColor = firstItem.strokeColor.spot.name;
					}

			}
			return thisColor;
		}
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
		// "prodColors" : ["cut line", "cutline", "sewline", "sew line", "thru-cut", "jock tag b", "info b"],
		"prodColors" : "cut line, cutline, sewline, sew line, thru-cut, jock tag b, info b",
		// "artColors" : ["collar b", "collar 2 b", "collar info b", "boombah logo b", "boombah logo 2 b"],
		"artColors" : "collar b, collar 2 b, collar info b, boombah logo b, boombah logo 2 b",
		"artColorsRegEx" : /c[0-9]{1,2}/i,
		"curSize" : "",
		"curGroup" : null,
		"prodGroup" : null,
		"artGroup" : null,
		"wrongPaths" : null

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
	var errorList = [];

	var wrongColors = false;
	var wrongColorCounter = 0;
	var wrongLayer = docRef.layers.add();
	wrongLayer.name = "wrongPaths";
	lib["wrongPaths"] = wrongLayer.groupItems.add();

	var valid = true;
	ppLay.visible = true;

	fixCompoundPaths();

	var tempLay = docRef.layers.add();
	tempLay.name = "temp";

	valid = loopSizes(ppLay);

	tempLay.remove();

	$.writeln("lib[\"wrongPaths\"].pageItems.length = " + lib["wrongPaths"].pageItems.length);
	if(lib["wrongPaths"].pageItems.length < 1)
	{
		wrongLayer.remove();
	}
	// if(lib["wrongPaths"].length > 0)
	// {
	// 	var wrongPaths = docRef.groupItems.add();
	// 	wrongPaths.name = "Wrong Paths";
	// 	for(var wp = lib["wrongPaths"].length-1;wp >-1; wp--)
	// 	{
	// 		var thisWrongPath = lib["wrongPaths"][wp];
	// 		thisWrongPath.moveToBeginning(wrongPaths);
	// 	}
	// }


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