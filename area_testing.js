function getAreaTesting()
{
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

	function intersects(item,item2)
	{
		//item coordinates
		var IL = item.left;
		var IT = item.top;
		var IR = item.left + item.width;
		var IB = item.top - item.height;

		//dest coordinates
		var DL = item2.left;
		var DT = item2.top;
		var DR = item2.left + item2.width;
		var DB = item2.top - item2.height;

		//check for anything that could make overlap false
		//if any of these conditions are true, an intersection is impossible
		return !(IL > DR || IR < DL || IT < DB || IB > DT ) 
	}

	function getArea(item)
	{
		var totalArea = 0;
		var len, thisItem, thisType = item.typename, cpCopy;

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
			var curItem, intersections,largest,nextLargest,sorted = [];

			var cpItems = [];
			for (var x = 0; x < len; x++)
			{
				cpItems.push(item.pathItems[x]);
			}

			if(len === 1)
			{
				totalArea += Math.abs(cpItems[0].area);
			}

			else if(len === 2)
			{
				largest = getLargest(cpItems);
				cpItems.splice(largest.index,1);
				if(intersects(largest.largest,cpItems[0]))
				{
					totalArea += Math.abs(largest.largest.area) - Math.abs(cpItems[0].area);
				}
				else
				{
					totalArea += Math.abs(largest.largest.area) + Math.abs(cpItems[0].area);
				}
			}

			else if(len > 2)
			{
				largest = getLargest(cpItems);
				cpItems.splice(largest.index,1);
				intersections = [];
				len = cpItems.length;
				thisItem = cpItems[0];
				for(var x=1;x<len;x++)
				{
					if(intersects(thisItem,cpItems[x]))
					{
						intersections.push(cpItems[x]);
					}
					else
					{
						totalArea += Math.abs(cpItems[x].area);
					}

				}
				if(intersections.length)
				{
					alert("intersections were found");
					cpCopy = item.duplicate(tempLay);
					cpCopy = tempLay.pageItems[0];
					docRef.selection = null;
					cpCopy.selected = true;
					app.executeMenuCommand("Live Pathfinder Add");
					app.executeMenuCommand("expandStyle");
					cpCopy = tempLay.groupItems[0];
					totalArea += getArea(cpCopy);
					// cpCopy.remove();
				}
				else
				{
					totalArea += Math.abs(largest.largest.area);
					for(var x=0;x<len;x++)
					{
						if(intersects(largest.largest,cpItems[x]))
						{
							totalArea -= Math.abs(cpItems[x].area);
						}
						else
						{
							totalArea += Math.abs(cpItems[x].area);
						}
					}
				}
			}

			
		}


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

	if(app.documents.length && app.activeDocument.selection.length)
	{	
		var docRef = app.activeDocument;
		var sel = docRef.selection[0];
		if(sel.typename === "PlacedItem" || sel.typename === "SymbolItem" || sel.typename === "TextFrame")
		{
			alert("Woops...\nSorry, this doesn't work for " + sel.typename + "s.\nPathItems, CompoundPathItems, and GroupItems (or some combination thereof) only.")
		}
		else
		{
			var tempLay = docRef.layers.add();
			tempLay.name = "temp";
			$.writeln(getArea(app.activeDocument.selection[0]));
			// tempLay.remove();
		}
	}
	else
	{
		alert("You must have a document open and something selected.");
	}
	
}
getAreaTesting();