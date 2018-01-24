

function container()
{
	var valid = true;
	eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/Utilities_Container.jsxbin\"");
	eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/Batch_Framework.jsxbin\"");
	// eval("#include \"~/Desktop/automation/utilities/Batch_Framework.js\"");


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

	function updateProdInfo()
	{
		if(app.activeDocument.name === srcDoc.name)
		{
			app.documents[1].activate();
		}

		var docRef = app.activeDocument;
		var layers = docRef.layers;

		var tmpContainerGroup = containerGroup.duplicate(docRef);
		
		var ppLay = getPPLay(layers);
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

	var srcDoc = app.activeDocument;
	var containerGroup, dests = [];

	getPieces(srcDoc);
	batchInit(updateProdInfo,"Replaced production info with fixed version.");

	if(errorList.length)
	{
		sendErrors(errorList);
	}
}
container();