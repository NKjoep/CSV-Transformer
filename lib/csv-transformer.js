/* CSV Transformer by Andrea Dessì <nkjoep@gmail.com> - MIT License */
window.addEvent("domready", function(){
	
	var separator = document.id("separator").get("value");
	var separator_text = document.id("separator-text").get("value");
	var column_map = document.id("column-map");
	var column_map_submit = document.id("column-map-submit");
	var column_map_submit_go = document.id("column-map-submit-go");
	var output_map=document.id("output-map");
	var output_map_submit_go = document.id("output-map-submit-go");
	var conditional = document.id("conditional");
	var data = document.id("data");
	var output = document.id("data-output");
	var cond_emtpy = document.id("cond_emtpy");
	var postrules = document.id("postrules");
	var addpostrule = document.id("addpostrule");
	
	//headers mapping
	column_map_submit_go.addEvent("click",function(ev){
		ev.stop;
		ev.preventDefault();
		column_map_submit.empty();

		var trcond = conditional.getElements("tr.cond");
		if (trcond.length>0) {
			trcond.destroy();
		}

		separator = document.id("separator").get("value");
		separator_text = document.id("separator-text").get("value");

		//debugger;
		var columns = column_map.get("value").trim().replace(/\n\r/g,"\n");
		columns = columns.split(separator);
	
		var trTH = new Element("tr");
		trTH.inject(column_map_submit);	
		
		Array.each(columns, function(field, index){
			if (separator_text!="") {
				var separatorLength = separator_text.length;
				if (field.substring(0,separatorLength)==separator_text) {
					field = field.substring(separatorLength);
				}
				
				var stringEnd = field.length;
				var string_cut_end = stringEnd-separatorLength;
				
				if (field.substring(string_cut_end)==separator_text) {
					field = field.substring(0,string_cut_end);
				}
			}
			var label = new Element("label", {
				"for": "field"+index,
				"text": field
			});
			var inputfield = new Element("input", {
				"type": "text",
				"id": "field"+index,
				"value": "{"+field+"}"
			});
			 
			var cTr = new Element("tr", {"class": "cond"});
			var ctd1 = new Element("td",{text: ""});
			var ctd2 = new Element("td",{text: ""});
			var ctd3 = new Element("td",{text: ""});

			ctd1.inject(cTr);
			ctd2.inject(cTr);
			ctd3.inject(cTr);
			
			ctd1.set("text","{"+field+"}");
			new Element("input", {name: "search"}).inject(ctd2);
			new Element("input",{name: "replace"}).inject(ctd3);
			cTr.inject(conditional);

			var tr = new Element("tr");
			var td1 = new Element("td");
			var td2 = new Element("td");
			label.inject(td1);
			inputfield.inject(td2);
			td1.inject(tr);
			td2.inject(tr);
			tr.inject(column_map_submit);
		});
		
		var mappings = column_map_submit.getElements("input");
		output_map.set("value","");
		Array.each(mappings, function(item, index){
			output_map.set("value",output_map.get("value")+item.get("value")+"\n");
		});
	});

	//add post processing rule
	addpostrule.addEvent("click", function(ev){

		separator = document.id("separator").get("value");
		separator_text = document.id("separator-text").get("value");	

		ev.stop();
		ev.preventDefault();
		var tr = new Element("tr",{"class": "rule"});
		var searchTd = new Element("td");
		var replaceTd = new Element("td");
		var removeTd = new Element("td");
		searchTd.inject(tr);
		replaceTd.inject(tr);
		removeTd.inject(tr);
		new Element("input", {type: "text"}).inject(searchTd);
		new Element("input", {type: "text"}).inject(replaceTd);
		new Element("input", {
			"value": "remove",
			"type": "submit",
			"events": {
				"click": function(ev){
					ev.preventDefault();
					tr.destroy();
				}.bind(tr)
			}
		}).inject(removeTd);
		tr.inject(postrules);
	});

	
	//process data
	output_map_submit_go.addEvent("click", function(ev){
		
		ev.stop;
		ev.preventDefault();
		output.empty();

		separator = document.id("separator").get("value");
		separator_text = document.id("separator-text").get("value");

		var condEmtpy = cond_emtpy.get("value");

		var field_mapping = column_map_submit.getElements("input");
		var rows = data.get("value").trim().split("\n");
		for (var i = 0; i< rows.length;i++) {
			var current_row = rows[i];
			var columns = current_row.split(separator);
			var output_string = output_map.get("value");
			var substituteObj = {};
			Array.each(field_mapping, function(item, index){
				var value = columns[index];
				if (separator_text!="") {
					value = value.substring(separator_text.length);
					value = value.substring(0,value.length-separator_text.length);
				}
				//conditionals
				if (value.length==0  && condEmtpy!="") {
					value = condEmtpy;					
				}
				else {
					var sr = conditional.getElements("tr")[2+index].getElements("input");
					var search =  sr[0].get("value");
					if (search.length > 0) {
						search = new RegExp(search,"g");		
						var replace = sr[1].get("value");
						value = value.replace(search,replace);
					}
				}
				substituteObj[item.get("value").replace(/{/g,"").replace(/}/g,"")] = value;
			});
			output_string = output_string.substitute(substituteObj);
			
			var postRules = postrules.getElements("tr.rule");
			if (postRules.length>0) {
				Array.each(postRules, function(item,index){
					var inputs = item.getElements("input");
					var searchReg = inputs[0].get("value");	
					if (searchReg.length > 0) {
						searchReg = new RegExp(searchReg,"g");
						var replaceWith = inputs[1].get("value");
						output_string = output_string.replace(searchReg,replaceWith);
					}
				});
			}
			new Element("pre",{text: output_string}).inject(output);
		}
	});

});