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
				var oneDoc = btnGroup.add("button", undefined, "Just This Document");
					oneDoc.onClick = function()
					{
						groupPrepress();
						w.close();
					}
				var allDocs = btnGroup.add("button", undefined, "All Open Documents");
					allDocs.onClick = function()
					{
						while(app.documents.length > 0 && valid)
						{
							groupPrepress();
							app.activeDocument.close(SaveOptions.SAVECHANGES);
						}
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
			curSize = curLay.name;
			pieceLen = curLay.pageItems.length;
			for(var p=pieceLen-1;p>=0;p--)
			{
				curPiece = curLay.pageItems[p];
				pieceName = curPiece.name;
				// if(pieceName === "Artwork" || pieceName === "Prod Info")
				// {
				// 	curPiece.name += "-existing";
				// }
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
			// else
			// {
			// 	wrongColors.push(curPiece);
			// }
		}
		else if(curPiece.typename === "CompoundPathItem")
		{
			dest = getDest(curPiece.pathItems[0]);
			if(dest)
			{
				curPiece.moveToBeginning(dest);
			}
			// else
			// {
			// 	wrongColors.push(curPiece);
			// }
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
		var curItem,curColor;
		for(var x = len-1;x>=0;x--)
		{
			curItem = group.pageItems[x];
			if(curItem.typename === "CompoundPathItem")
			{
				if(curItem.pathItems[0].filled)
				{
					curColor = curItem.pathItems[0].fillColor.spot.name;
				}
				else if(curItem.pathItems[0].stroked)
				{
					curColor = curItem.pathItems[0].strokeColor.spot.name;
				}
			}
			else if(curItem.typename === "PathItem")
			{
				if(curItem.filled)
				{
					curColor = curItem.fillColor.spot.name;
				}
				else if(curItem.stroked)
				{
					curColor = curItem.strokeColor.spot.name;
				}
			}
			if(!colorObj[curColor])
			{
				colorObj[curColor] = [];
			}
			colorObj[curColor].push(curItem);
		}

		//create a group for each color and move all items of that color into the group
		var colorGroup,len;
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

	function rearrange(group)
	{
		var len = group.pageItems.length;
		var smallest,
			smallestGroup,
			curGroup;
		while(len > 0)
		{
			smallest = group.pageItems[0].height + group.pageItems[0].width;
			smallestGroup = group.pageItems[0];
			for(var x = len-1; x>=0;x--)
			{
				curGroup = group.pageItems[x];
				if(curGroup.height + curGroup.width < smallest)
				{
					smallest = curGroup.height + curGroup.width;
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
		ppLay = getPPLay(layers);
		tempLay = layers.add();
		tempLay.name = "temp";

		//unlock and unhide prepress layer
		hideUnhide(ppLay,true);
		fixCompoundPaths();

		loopSizes();


		hideUnhide(ppLay,false);

		if(wrongColors.length > 0)
		{
			alert("There were " + wrongColors.length + " items in this file that used wrong colors. Fix it up and try again.");
			alert("Exiting batch.");
			valid = false;
		}
		if(tempLay.pageItems.length < 1)
		{
			tempLay.remove();
		}
	}


	////////End//////////
	///Logic Container///
	/////////////////////

	var docRef,layers,ppLay,artGroup,prodGroup,tempLay;

	var prodColors = "cut line, cutline, sewline, sew line, thru-cut, jock tag b, info b";
	var artColors = "collar b, collar 2 b, collar info b, care label b, care label 2 b, boombah logo b, boombah logo 2 b, pocket facing, pocket welt 1, pocket welt 2";
	var artRegEx = /[cb][\d]{1,2}/i;

	var wrongColors = [];

	if(valid)
	{
		batchPrompt();
	}

}
properFdGrouping();