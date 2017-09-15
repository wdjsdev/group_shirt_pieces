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
						while(app.documents.length > 0)
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
		var artGroup,prodGroup;
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
				checkPaths(curPiece,artGroup,prodGroup);
			}
		}
	}

	function checkPaths(curPiece,artGroup,prodGroup)
	{
		if(curPiece.typename === "GroupItem" && curPiece.pageItems.length === 0)
		{
			curPiece.remove();
			return;
		}

		//loop the children of curPiece and distribute into appropriate groups.
	}

	function groupPrepress()
	{
		docRef = app.activeDocument;
		layers = docRef.layers;
		ppLay = getPPLay(layers);

		fixCompoundPaths();

		loopSizes();
	}


	////////End//////////
	///Logic Container///
	/////////////////////

	var docRef,layers,ppLay;

	if(valid)
	{
		batchPrompt();
	}

}
properFdGrouping();