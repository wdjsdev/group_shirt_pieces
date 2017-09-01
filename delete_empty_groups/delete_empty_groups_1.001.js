function deleteEmptyGroups()
{
	var docRef = app.activeDocument;
	var layers = docRef.layers;
	var aB = docRef.artboards;
	var swatches = docRef.swatches;
	var obj = {};
	var arr = [];

	var ppLay = layers[0].layers["Prepress"];
	ppLay.visible = true;

	//deleteEmptyGroups Function Description
	//run through each shirt piece and remove any extraneous groups leftover
	//if the group is not called "Artwork" or "Prod Info", get rid of it
	var localValid = true;

	for(var a=0;a<ppLay.layers.length;a++)
	{
		var curLay = ppLay.layers[a];
		for(var b=0;b<curLay.groupItems.length;b++)
		{
			var thisPiece = curLay.groupItems[b];
			for(var c = thisPiece.groupItems.length-1;c >-1; c--)
			{
				var thisGroup = thisPiece.groupItems[c];
				if(thisGroup.name != "Artwork" && thisGroup.name != "Prod Info")
				{
					thisGroup.remove();
				}
			}
		};
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
		deleteEmptyGroups();
	}
	function batchAll()
	{
		while(app.documents.length > 0)
		{
			deleteEmptyGroups();
			app.activeDocument.close(SaveOptions.SAVECHANGES);
		}
	}
}
determineBatch();