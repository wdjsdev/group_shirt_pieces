function fixNotches()
{
	var docRef = app.activeDocument;
	var layers = docRef.layers;
	var aB = docRef.artboards;
	var swatches = docRef.swatches;
	
	var ppLay = docRef.layers[0].layers["Prepress"];
	ppLay.visible = true;
	

	var srcDoc = app.documents["corrected_version.ai"];
	var srcPP = srcDoc.layers[0].layers["Prepress"];
	srcPP.visible = true;


	//delete prodInfo from docRef
	for(var a=0;a<ppLay.layers.length;a++)
	{
		var curLay = ppLay.layers[a];
		var curSize = curLay.name;
		for(var b=0;b<curLay.groupItems.length;b++)
		{
			var thisPiece = curLay.groupItems[b];
			var srcPiece = srcPP.layers[curSize].groupItems[thisPiece.name].groupItems["Prod Info"];
			var prodGroup = thisPiece.groupItems["Prod Info"];
			prodGroup.remove();
			var srcPieceCopy = srcPiece.duplicate(docRef);
			srcPieceCopy.moveToBeginning(thisPiece);
		}
	}
	ppLay.visible = false;


}

function determineBatch()
{
	var w = new Window("dialog", "All documents or just one?");
		var txtGroup = w.add("group");
			var txt = txtGroup.add("statictext", undefined, "Do you want to batch all documents or just the current active document?");

		var btnGroup = w.add("group");
			var allBtn = btnGroup.add("button", undefined, "Batch All");
				allBtn.onClick = function()
				{
					w.close();
					batchAll();
				}
			var oneBtn = btnGroup.add("button", undefined, "Just Active Doc");
				oneBtn.onClick = function()
				{
					w.close();
					justCurrentDoc();
				}
			var cancelBtn = btnGroup.add("button", undefined, "Cancel");
				cancelBtn.onClick = function()
				{
					w.close();
				}
	w.show();

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
			fixNotches();
			app.activeDocument.close(SaveOptions.SAVECHANGES);
		}
	}
}
determineBatch();