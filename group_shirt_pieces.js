//
function groupShirtPieces()
{
	var docRef = app.activeDocument;
	var layers = docRef.layers;
	var aB = docRef.artboards;
	var swatches = docRef.swatches;
	var obj = {};
	var arr = [];

	var buffer = 10;

	var sel = docRef.selection;

	var compLay = docRef.layers.add();
	compLay.zOrder(ZOrderMethod.SENDTOBACK);
	compLay.name = "completed";


	for(var a=0;a<layers[0].pageItems.length;a++)
	{
		var thisItem = layers[0].pageItems[a];
		arr.push(thisItem);
	}


	for(var a = sel.length-1;a >-1; a--)
	{
		var cont = sel[a];
		var cl = cont.left;
		var cr = cont.left + cont.width;
		var ct = cont.top;
		var cb = cont.top - cont.height;
		var newGroup = compLay.groupItems.add();
		var counter = 0;
		for(var b = arr.length-1;b >-1; b--)
		{
			var thisItem = arr[b];

			var l = thisItem.left;
			var r = thisItem.left + thisItem.width;
			var t = thisItem.top;
			var bot = thisItem.top - thisItem.height;
			if(l >= (cl - buffer) && r <= (cr + buffer) && t <= (ct + buffer) && bot >= (cb - buffer))
			{
				thisItem.moveToBeginning(newGroup);
				arr.splice(b,1);
				counter++;
			}

		}
		cont.remove();
	}

	layers[0].remove();
}

groupShirtPieces();