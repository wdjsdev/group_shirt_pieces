

function determineBatch()
{
	var valid = false;
	eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/Utilities_Container.jsxbin\"");

	var containerGroup, dests = [];
	var bd = new Date();
	var beforeTime,afterTime;

	var srcDoc = app.documents["corrected_version.ai"];
	getPieces(srcDoc);

	var w = new Window("dialog", "All documents or just one?");
		var txtGroup = w.add("group");
			var txt = txtGroup.add("statictext", undefined, "Do you want to batch all documents or just the current active document?");

		var btnGroup = w.add("group");
			var allBtn = btnGroup.add("button", undefined, "Batch All");
				allBtn.onClick = function()
				{
					beforeTime = bd.getTime();
					w.close();
					batchAll(containerGroup);
				}
			var oneBtn = btnGroup.add("button", undefined, "Just Active Doc");
				oneBtn.onClick = function()
				{
					beforeTime = bd.getTime();
					w.close();
					justCurrentDoc(containerGroup);
				}
			var cancelBtn = btnGroup.add("button", undefined, "Cancel");
				cancelBtn.onClick = function()
				{
					w.close();
				}
	w.show();

	function getPieces(doc)
	{
		doc.activate();
		var layers = doc.layers;
		var ppLay = getPPLay(layers);
		containerGroup = doc.groupItems.add();
		containerGroup.name = "container";

		var sizeLen = ppLay.layers.length,
			curSizeLay,
			pieceLen,
			curPiece,
			curSizeArray;

		for(var x=0;x<sizeLen;x++)
		{
			curSizeLay = ppLay.layers[x];
			pieceLen = curSizeLay.pageItems.length;
			curSizeArray = [];
			for(var y=0;y<pieceLen;y++)
			{
				curPiece = curSizeLay.pageItems[y].groupItems["Prod Info"];
				curSizeArray.push(curPiece.parent.name);
				curPiece.duplicate(containerGroup);
			}
			dests.push(curSizeArray);
		}

	}

	function justCurrentDoc()
	{
		fixNotches();
	}
	function batchAll()
	{
		while(app.documents.length > 1)
		{
			if(app.activeDocument.name == "corrected_version.ai")
			{
				app.documents[1].activate();
			}
			fixNotches(containerGroup);
			app.activeDocument.close(SaveOptions.SAVECHANGES);
		}
	}

	function fixNotches()
	{
		if(app.activeDocument.name === "corrected_version.ai")
		{
			app.documents[1].activate();
		}

		var docRef = app.activeDocument;
		var layers = docRef.layers;

		var tmpContainerGroup = containerGroup.duplicate(docRef);
		
		var ppLay = docRef.layers[0].layers["Prepress"];
		ppLay.visible = true;
		
		var len = dests.length;
		var items,sizeLen,thisDest,curSizeLay;


		for(var x=len-1;x>=0;x--)
		{
			sizeLen = dests[x].length;;
			curSizeLay = ppLay.layers[x];
			items = curSizeLay.groupItems;
			for(var y=sizeLen-1;y>=0;y--)
			{
				thisDest = dests[x][y];
				thisItem = items[thisDest];
				thisItem.groupItems["Prod Info"].remove();
				tmpContainerGroup.pageItems[0].moveToBeginning(thisItem);
			}
		}
		
		tmpContainerGroup.remove();
		ppLay.visible = false;



	}
	var ad = new Date();
	afterTime = ad.getTime();

	$.writeln("Script execution took: " + (afterTime - beforeTime) + " miliseconds.");
}
determineBatch();