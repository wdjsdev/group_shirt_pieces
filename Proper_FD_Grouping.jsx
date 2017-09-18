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
				artGroup = curPiece.groupItems.add();
				artGroup.name = "Artwork";
				prodGroup = curPiece.groupItems.add();
				prodGroup.name = "Prod Info";
				checkPaths(curPiece);

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
			}
			else
			{
				result = undefined;
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
			}
			else
			{
				result = undefined;
				wrongColors.push(path);
			}
		}

		return result;

	}

	function groupPrepress()
	{
		docRef = app.activeDocument;
		layers = docRef.layers;
		ppLay = getPPLay(layers);

		fixCompoundPaths();

		loopSizes();

		if(wrongColors.length > 0)
		{
			alert("There were " + wrongColors.length + " items in this file that used wrong colors. Fix it up and try again.");
			alert("Exiting batch.");
			valid = false;
		}
	}


	////////End//////////
	///Logic Container///
	/////////////////////

	var docRef,layers,ppLay,artGroup,prodGroup;

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