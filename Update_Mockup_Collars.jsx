function container()
{
	var valid = true;
	eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/Utilities_Container.jsxbin\"");
	eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/Batch_Framework.jsxbin\"");

	function correctPosition(item)
	{
		// [left,top,right,bottom]
		var pos = [479.813004029858, -733.253699999999, 638.410102275053, -764.912966666661];


		return !(item.left > pos[2] || item.top < pos[3] || (item.left + item.width) < pos[0] || (item.top - item.height) > pos[1]);
	}

	function replaceCollars()
	{
		var docRef = app.activeDocument;
		var layers = docRef.layers;

		//find existing collar and delete it
		var mockLay = layers[0].layers["Mockup"];
		var item, isCorrectPosition, dest = mockLay.groupItems.add();
		dest.name = "Mockup Collar";
		for (var x = mockLay.pageItems.length - 1; x >= 1; x--)
		{
			item = mockLay.pageItems[x];
			isCorrectPosition = correctPosition(item);
			if (isCorrectPosition && (item.typename === "CompoundPathItem" && item.pathItems[0].fillColor.spot.name.indexOf("Collar") > -1))
			{
				item.remove();
			}
			else if (isCorrectPosition)
			{
				item.moveToBeginning(dest);
				// item.zOrder(ZOrderMethod.SENDTOBACK);
			}
		}

		docRef.selection = null;
		app.executeMenuCommand("pasteInPlace");
		var mockCollarInfo = docRef.selection[0];
		mockCollarInfo.moveToBeginning(dest);
	}

	var msg = "Fixed up mockup display collars";
	batchInit(replaceCollars,msg);
	// replaceCollars();
}
container();