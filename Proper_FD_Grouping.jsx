/*
	Script Name: Proper Full Dye Grouping
	Author: William Dowling
	Creation Date: 15 September, 2017
	Description: 
		Loop all the artwork in the prepress layer and 
		distribute prod info into one group, art stuf into
		another group, then group those two groups together.
*/

function properFdGrouping()
{
	var valid = true;
	#include "/Volumes/Customization/Library/Scripts/Script Resources/Data/Utilities_Container.js";

	///////Begin/////////
	///Logic Container///
	/////////////////////

	function batchPrompt()
	{
		/* beautify ignore:start */
		var w = new Window("dialog", "Current Document or All Documents?");
			var btnGroup = w.add("group");
			btnGroup.orientation = "column";
				var oneDoc = btnGroup.add("button", undefined, "Just This Document");
					oneDoc.onClick = function()
					{
						groupPrepress();
						w.close();
					}
				var getBatchDocs = btnGroup.add("button", undefined, "Open A Folder to Batch");
					getBatchDocs.onClick = function()
					{
						getFilesToBatch();
						w.close();
					}
				var allDocs = btnGroup.add("button", undefined, "All Open Documents");
					allDocs.onClick = function()
					{
						batchOpenDocs();
						w.close();
					}
				var cancel = btnGroup.add("button", undefined, "Cancel");
					cancel.onClick = function()
					{
						w.close();
					}
		w.show();
		/* beautify ignore:end */
	}

	function batchOpenDocs()
	{
		var len = app.documents.length;
		for(var x=0;x<len;x++)
		{
			batchFiles.push(app.documents[x]);
		}
		executeBatch();
		saveAndClose();
	}

	function getFilesToBatch()
	{
		var batchFolder = new Folder("~/Desktop/converted_template_backups/");  
		  
		var myFolder = batchFolder.selectDlg ("Select file, preselecting this folder"); 

		var files = myFolder.getFiles();
		var len = files.length;

		for(var x=0;x<len;x++)
		{
			if(files[x].name.indexOf("FD") === 0)
			{
				app.open(files[x]);
				batchFiles.push(app.activeDocument);
			}
		}
		executeBatch();
		saveAndClose();
	}

	function executeBatch()
	{
		var len = batchFiles.length;
		for(var x=len-1;x>=0 && valid;x--)
		{
			batchFiles[x].activate();
			if(!groupPrepress())
			{
				problemFiles.push(batchFiles[x]);
				batchFiles.splice(x,1);
			}
		}
	}

	function saveAndClose()
	{
		len = batchFiles.length;
		for(var x=len-1;x>=0;x--)
		{
			batchFiles[x].activate();
			app.executeMenuCommand("fitin");
			batchFiles[x].close(SaveOptions.SAVECHANGES);
		}
		if(problemFiles.length)
		{
			alert(problemFiles.length + " files had incorrect colors.");
		}
	}

	function fixCompoundPaths()
	{
		var cPaths = docRef.compoundPathItems;
		var cpLen = cPaths.length;
		var thisPath;
		for(var cp=0;cp<cpLen;cp++)
		{
			thisPath = cPaths[cp];
			if(thisPath.layer.parent.name === "Prepress" && thisPath.pathItems.length === 0)
			{
				thisPath.layer.locked = false;
				thisPath.layer.visible = true;
				docRef.selection = null;
				thisPath.selected = true;
				app.executeMenuCommand("noCompoundPath");
				app.executeMenuCommand("ungroup");
				app.executeMenuCommand("ungroup");
				app.executeMenuCommand("ungroup");
				app.executeMenuCommand("compoundPath");
				docRef.selection = null;
			}
		}
	}

	function loopSizes()
	{
		var ppLen = ppLay.layers.length;
		var curLay,curSize;
		var pieceLen,curPiece,pieceName;
		for(var ls=0;ls<ppLen;ls++)
		{
			curLay = ppLay.layers[ls];
			curLay.visible = true;
			curLay.locked = false;
			curSize = curLay.name;
			pieceLen = curLay.pageItems.length;
			for(var p=pieceLen-1;p>=0;p--)
			{
				curPiece = curLay.pageItems[p];
				curPiece.hidden = false;
				curPiece.locked = false;
				pieceName = curPiece.name;
				try
				{
					curPiece.groupItems["Artwork"].name += "-existing";
					curPiece.groupItems["Prod Info"].name += "-existing";
				}
				catch(e)
				{
					// just keep going
				}
				artGroup = curPiece.groupItems.add();
				artGroup.name = "Artwork";
				prodGroup = curPiece.groupItems.add();
				prodGroup.name = "Prod Info";
				checkPaths(curPiece);
				makeSubGroups(artGroup);
				makeSubGroups(prodGroup);
				deleteEmptyGroups(curPiece);
			}
		}
	}

	function checkPaths(curPiece)
	{
		var dest;
		if(curPiece.typename === "GroupItem" && curPiece.pageItems.length === 0)
		{
			curPiece.remove();
			return;
		}

		//loop the children of curPiece and distribute into appropriate groups.
		if(curPiece.typename === "TextFrame")
		{
			curPiece.moveToBeginning(prodGroup);
		}

		else if(curPiece.typename === "PathItem")
		{
			dest = getDest(curPiece);
			if(dest)
			{
				curPiece.moveToBeginning(dest);
			}
		}
		else if(curPiece.typename === "CompoundPathItem")
		{
			dest = getDest(curPiece.pathItems[0]);
			if(dest)
			{
				curPiece.moveToBeginning(dest);
			}
		}
		else if(curPiece.typename === "GroupItem")
		{
			var len = curPiece.pageItems.length;
			for(var x = len -1;x>=0;x--)
			{
				checkPaths(curPiece.pageItems[x]);
			}
		}
	}

	function getDest(path)
	{
		var result;

		if (path.filled)
		{
			path.stroked = false;
			var fillType = path.fillColor.typename;
			if (fillType === "SpotColor")
			{
				var fillName = path.fillColor.spot.name.toLowerCase();
				if (prodColors.indexOf(fillName) > -1)
				{
					result = prodGroup;
				}
				else if (artColors.indexOf(fillName) > -1 || artRegEx.test(fillName))
				{
					result = artGroup;
				}
				else
				{
					path.moveToBeginning(tempLay);
					wrongColors.push(path);
				}
			}
			else
			{
				path.moveToBeginning(tempLay);
				wrongColors.push(path);
			}
		}
		else if (path.stroked)
		{
			var strokeType = path.strokeColor.typename;
			if (strokeType === "SpotColor")
			{
				var strokeName = path.strokeColor.spot.name.toLowerCase();
				if (prodColors.indexOf(strokeName) > -1)
				{
					result = prodGroup;
				}
				else if (artColors.indexOf(strokeName) > -1 || artRegEx.test(strokeName))
				{
					result = artGroup;
				}
				else
				{
					path.moveToBeginning(tempLay);
					wrongColors.push(path);
				}
			}
			else
			{
				path.moveToBeginning(tempLay);
				wrongColors.push(path);
			}
		}
		else
		{
			path.remove();
		}

		return result;
	}

	function makeSubGroups(group)
	{
		var colorObj = {};
		var len = group.pageItems.length;
		var curItem,curColor,colorGroup;
		for(var x = len-1;x>=0;x--)
		{
			curItem = group.pageItems[x];
			curColor = getCurColor(curItem);
			if(!colorObj[curColor])
			{
				colorObj[curColor] = [];
			}
			colorObj[curColor].push(curItem);
		}

		//create a group for each color and move all items of that color into the group
		// var colorGroup,len;
		for(var color in colorObj)
		{
			colorGroup = group.groupItems.add();
			colorGroup.name = color;
			len = colorObj[color].length;
			for(var x=0;x<len;x++)
			{
				colorObj[color][x].moveToBeginning(colorGroup);
			}
			rearrange(colorGroup);
			
		}

		//subgroups have been created
		//rearrange the art so the largest pieces are 
		//in the back and smallest are in the front.
		rearrange(group);

	}

	function getCurColor(item)
	{
		var result;
		if(item.typename === "CompoundPathItem")
		{
			if(item.pathItems[0].filled)
			{
				result = item.pathItems[0].fillColor.spot.name;
			}
			else if(item.pathItems[0].stroked)
			{
				result = item.pathItems[0].strokeColor.spot.name;
			}
		}
		else if(item.typename === "PathItem")
		{
			if(item.filled)
			{
				result = item.fillColor.spot.name;
			}
			else if(item.stroked)
			{
				result = item.strokeColor.spot.name;
			}
		}
		return result;
	}

	function rearrange(group)
	{
		var len = group.pageItems.length;
		var smallest,
			smallestGroup,
			curGroup,
			curArea;
		while(len > 0)
		{
			// smallest = group.pageItems[0].height + group.pageItems[0].width;
			smallest = getArea(group.pageItems[0]);
			smallestGroup = group.pageItems[0];
			for(var x = len-1; x>=0;x--)
			{
				curGroup = group.pageItems[x];
				curArea = getArea(curGroup);
				if(curArea < smallest)
				{
					smallest = curArea;
					smallestGroup = curGroup;
				}
			}
			smallestGroup.zOrder(ZOrderMethod.SENDTOBACK);
			len--;
		}
	}

	function deleteEmptyGroups(group)
	{
		var len = group.pageItems.length;
		var curItem;
		for(var x=len-1;x>=0;x--)
		{
			curItem = group.pageItems[x];
			if(curItem.name !== "Artwork" && curItem.name !== "Prod Info")
			{
				curItem.remove();
			}
		}
	}

	function hideUnhide(layer,bool)
	{
		layer.visible = bool;
	}

	function groupPrepress()
	{
		docRef = app.activeDocument;
		layers = docRef.layers;
		swatches = docRef.swatches;
		ppLay = getPPLay(layers);
		tempLay = layers.add();
		tempLay.name = "temp";

		//unlock and unhide prepress layer
		hideUnhide(ppLay,true);
		fixCompoundPaths();
		fixSwatches();

		loopSizes();


		hideUnhide(ppLay,false);

		if(wrongColors.length > 0)
		{
			$.writeln("There were " + wrongColors.length + " items in the file: " + docRef.name + " that used wrong colors. Fix it up and try again.");
			wrongColors = [];
			return false;
		}
		if(tempLay.pageItems.length < 1)
		{
			tempLay.remove();
		}
		artgroup = null;
		prodGroup = null;
		tempLay = null;
		return true;
	}

	function getLargest(arr)
	{
		var largest, lDim, thisItem, thisDim, rmIndex, len = arr.length;

		largest = arr[0];
		lDim = Math.abs(largest.area);
		rmIndex = 0;
		for (var x = len - 1; x > 0; x--)
		{
			thisItem = arr[x];
			thisDim = Math.abs(thisItem.area);
			if (thisDim > lDim)
			{
				largest = thisItem;
				lDim = thisDim;
				rmIndex = x;
			}
		}
		return {"largest":largest,"index":rmIndex};

	}

	function getArea(item)
	{
		var totalArea = 0;
		var len, thisItem, thisType = item.typename;

		if (thisType === "PathItem")
		{
			totalArea += Math.abs(item.area);
		}

		
		//this version works fine in most cases,
		//however it breaks down if two subpaths of a compound
		//path are only partially overlapping. it also ignores
		//positive areas inside of negative areas in a compound path
		//for example, the bullseye of a target shaped compound path
		//made of 3 concentric circles
		else if (thisType === "CompoundPathItem")
		{
			len = item.pathItems.length;
			var cpItems = [];
			for (var x = 0; x < len; x++)
			{
				cpItems.push(item.pathItems[x]);
			}

			var curItem, intersections,largest,nextLargest;

			while (cpItems.length > 0)
			{
				curItem = cpItems[0];
				intersections = [curItem];
				len = cpItems.length;
				for (var x = len - 1; x >= 1; x--)
				{
					if (intersects(curItem, cpItems[x]))
					{
						intersections.push(cpItems[x])
						cpItems.splice(x, 1);
					}
				}
				cpItems.splice(0, 1);
				largest = getLargest(intersections);
				totalArea += Math.abs(largest.largest.area);
				intersections.splice(largest.index,1);
				if(intersections.length)
				{
					nextLargest = getLargest(intersections);
					totalArea -= Math.abs(nextLargest.largest.area);
				}
			}
		}

		//////////////////
		//Legacy Version//
		////Do Not Use////
		//////////////////
		// else if(thisType === "CompoundPathItem")
		// {
		// 	app.selection = null;
		// 	cpCopy = item.duplicate(tempLay);
		// 	cpCopy.selected = true;
		// 	app.doScript("Unite", "Scripting");
		// 	totalArea += getArea(cpCopy);
		// 	cpCopy.remove();
		// }

		// else if(thisType === "CompoundPathItem")
		// {
		// 	cpCopy = item.duplicate(tempLay);
		// 	docRef.selection = null;
		// 	cpCopy.selected = true;
		// 	app.executeMenuCommand("Live Pathfinder Add");
		// 	app.executeMenuCommand("expandStyle");
		// 	cpCopy = tempLay.groupItems[0];
		// 	totalArea += getArea(cpCopy);
		// 	cpCopy.remove();
		// }
		else if (thisType === "GroupItem")
		{
			len = item.pageItems.length;
			for (var x = 0; x < len; x++)
			{
				thisItem = item.pageItems[x];
				totalArea += getArea(thisItem);
			}
		}
		return Math.round(Math.abs(totalArea));
	}

	function fixSwatches()
	{
		var swatchLen = swatches.length;
		for(var x=0;x<swatchLen;x++)
		{
			swatches[x].name = swatches[x].name.replace(/^\s*/,"");
			swatches[x].name = swatches[x].name.replace(/\s*$/,"");
		}
	}


	////////End//////////
	///Logic Container///
	/////////////////////

	var docRef,layers,swatches,ppLay,artGroup,prodGroup,tempLay,batchFiles=[];

	var prodColors = "cut line, cutline, sewline, sew line, thru-cut, jock tag b, info b";
	var artColors = "collar b, collar 2 b, collar info b, care label b, care label 2 b, boombah logo b, boombah logo 2 b, pocket facing, pocket welt 1, pocket welt 2";
	var artRegEx = /[cb][\d]{1,2}/i;

	var wrongColors = [];
	var problemFiles = [];

	if(valid)
	{
		batchPrompt();
	}


}
properFdGrouping();