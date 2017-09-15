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
				lib["artGroup"].name = pieceName + " Artwork";
				lib["prodGroup"] = tempLay.groupItems.add();
				lib["prodGroup"].name = pieceName + " Prod Info";

				checkPaths(thisShirtPiece);
				lib["artGroup"].moveToBeginning(lib["curGroup"]);
				lib["prodGroup"].moveToBeginning(lib["curGroup"]);

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
				// for(var fc=0;fc<lib["prodColors"].length;fc++)
				// {
				// 	var thisProdColor = lib["prodColors"][fc];
				// 	if(fillName == thisProdColor)
				// 	{
				// 		isProd = true;
				// 	}
				// }
				// if(lib["artColorsRegEx"].test(fillName))
				// {
				// 	isArt = true;
				// }
				// else
				// {
				// 	for(var fc=0;fc<lib["artColors"].length;fc++)
				// 	{
				// 		var thisArtColor = lib["artColors"][fc];
				// 		if(fillName == thisArtColor)
				// 		{
				// 			isArt = true;
				// 		}
				// 	}
				// }
		}

		//check stroke color
		var strokeType = path.strokeColor.typename;

		switch(strokeType)
		{
			case "SpotColor" :
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
				// for(var sc=0;sc<lib["prodColors"].length;sc++)
				// {
				// 	var thisProdColor = lib["prodColors"][sc];
				// 	if(strokeName == thisProdColor)
				// 	{
				// 		isProd = true;
				// 	}
				// }
				// if(lib["artColorsRegEx"].test(strokeName))
				// {
				// 	isArt = true;
				// }
				// else
				// {
				// 	for(var fc=0;fc<lib["artColors"].length;fc++)
				// 	{
				// 		var thisArtColor = lib["artColors"][fc];
				// 		if(strokeName == thisArtColor)
				// 		{
				// 			isArt = true;
				// 		}
				// 	}
				// }
		}

		if(isProd)
		{
			result = lib["prodGroup"];
		}
		else if(isArt)
		{
			result = lib["artGroup"];
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
		"artGroup" : null

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