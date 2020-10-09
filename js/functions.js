var current_pathname = $(location).attr('pathname');
// For cohort_analysis, don't assign URLs in page based off of current pathname
if (current_pathname.split('/').pop() == "cohort_analysis.html") {
	current_pathname = current_pathname.replace(/cohort_analysis.html$/, "info.html");
}
// Show only one section
function hide_others(fragment) {
	$('.content_row').hide();
	$(types[fragment]).show();
	if (window.location.pathname.split('/').pop() != "cohort_analysis.html") {
		$('.sampleSelect').attr("href", function () { return current_pathname + "?sample=" + $(this).attr("id") + fragment });
		$('#cdr3_length').attr("href", function () { return "cdr3_length.html?sample=" + current_sample + fragment });
		$('#segment_usage').attr("href", function () { return "segment_usage.html?sample=" + current_sample + fragment });
	}
}
// Show all sections
function show_all() {
	$('.content_row').show();
	if (window.location.pathname.split('/').pop() != "cohort_analysis.html") {
		$('.sampleSelect').attr("href", function () { return current_pathname + "?sample=" + $(this).attr("id") });
		$('#cdr3_length').attr("href", function () { return "cdr3_length.html?sample=" + current_sample });
		$('#segment_usage').attr("href", function () { return "segment_usage.html?sample=" + current_sample });
	}
}
// Show class
function show_class(showclass) {
	$('.content_row').hide();
	$(showclass).show();
}
// Change path value
function change_path_val(path_val){
	path_val = path_val.replace(/\/?$/, '/');
	sessionStorage.setItem('path_val', path_val);
	location.reload(); 
}
//Load plotly figures
function load_plotly_bar(data_path,this_id){

	$.get(data_path + current_sample + "/" + this_id)
    .done(function() { 

		jQuery.get(data_path + current_sample + "/" + this_id, function (data) {
			var plot_type = this_id.split('/')[1].split('.')[0]
			var lines = data.split("\n");
			var layout = {
				autosize: true,
				xaxis: {
					title: plot_labels[plot_type][1]
				  },
				  yaxis: {
					title: plot_labels[plot_type][2]
				  },
				  title: plot_labels[plot_type][0]
				};
			var data2 = [
				{
				  x: lines[0].split(","),
				  y: lines[1].split(","),
				  type: 'bar'
				}
			  ];
			  Plotly.newPlot(this_id, data2,layout);

			  var content_id = $("#" + $.escapeSelector(this_id)).closest('.content_row').attr("id");
			  if ($('#' + content_id).find(".plotlyBar, .plotlyStackedBar").length > 0) {
				  $('#' + content_id + '_nav').show();
				  if ($.inArray(types[location.hash], ['blank', '#' + content_id]) >= 0) {
					  $('#' + content_id).show();
				  }
				}  
		}, dataType = 'text');

    }).fail(function() { 

		$("#" + $.escapeSelector(this_id)).parent().hide();

		var content_id = $("#" + $.escapeSelector(this_id)).closest('.content_row').attr("id");
		$("#" + $.escapeSelector(this_id)).closest('.col').remove();
		if (window.location.pathname.split('/').pop() == "cohort_analysis.html") {
			$("#" + $.escapeSelector(this_id)).closest('.col').remove();
		}
		if ($('#' + content_id).find(".plotlyBar, .plotlyStackedBar").length == 0) {
			$('#' + content_id).remove();
			$('#' + content_id + '_nav').remove();
			if (types[location.hash] == '#' + content_id) {
				window.location.replace(window.location.href.split('#')[0]);
			}
		}
    })
}
//Load plotly figures
function load_plotly_stacked_bar(data_path,this_id){

	$.get(data_path + current_sample + "/" + this_id)
    .done(function() { 

		jQuery.get(data_path + current_sample + "/" + this_id, function (data) {
			var plot_type = this_id.split('/')[1].split('.')[0]
			var lines = data.split("\n");
			var data2 = [];
			var layout = {
				barmode: 'stack',
				autosize: true,
				xaxis: {
					title: plot_labels[plot_type][1]
				  },
				  yaxis: {
					title: plot_labels[plot_type][2]
				  },
				  title: plot_labels[plot_type][0],
				//   annotations: [{
				// 		x:1.12,
				// 		y:1.05,
				// 		align:"right",
				// 		valign:"top",
				// 		text:plot_labels[plot_type][3],
				// 		showarrow:false,
				// 		xref:"paper",
				// 		yref:"paper",
				// 		xanchor:"center",
				// 		yanchor:"top"
				// 	}]
				};
			for (var i = 0; i < lines.length-1; i++) {

				data2['"'+lines[i].split(",")[0]+'"'] = data2['"'+lines[i].split(",")[0]+'"'] || {x: [], y: [], name: lines[i].split(",")[0], type: 'bar'};
				data2['"'+lines[i].split(",")[0]+'"']['x'].push(lines[i].split(",")[1]);
				data2['"'+lines[i].split(",")[0]+'"']['y'].push(lines[i].split(",")[2]);

				if (i == lines.length-2){
					array = [];
					for (var key in data2) {
						array.push(data2[key]);
					}
					Plotly.newPlot(this_id, array,layout);
				}
			}

			  var content_id = $("#" + $.escapeSelector(this_id)).closest('.content_row').attr("id");
			  if ($('#' + content_id).find(".plotlyBar, .plotlyStackedBar").length > 0) {
				  $('#' + content_id + '_nav').show();
				  if ($.inArray(types[location.hash], ['blank', '#' + content_id]) >= 0) {
					  $('#' + content_id).show();
				  }
				}
		}, dataType = 'text');
    }).fail(function() { 

		$("#" + $.escapeSelector(this_id)).parent().hide();

		var content_id = $("#" + $.escapeSelector(this_id)).closest('.content_row').attr("id");
		$("#" + $.escapeSelector(this_id)).closest('.col').remove();
		if (window.location.pathname.split('/').pop() == "cohort_analysis.html") {
			$("#" + $.escapeSelector(this_id)).closest('.col').remove();
		}
		if ($('#' + content_id).find(".plotlyBar, .plotlyStackedBar").length == 0) {
			$('#' + content_id).remove();
			$('#' + content_id + '_nav').remove();
			if (types[location.hash] == '#' + content_id) {
				window.location.replace(window.location.href.split('#')[0]);
			}
		}
    })

}


function save_img(div_name, file_format, file_name){

	Plotly.downloadImage(div_name, {format: file_format, width: 1200, height: 900, filename: file_name});

}


function tableSearchFunction() {
	// Declare variables
	var input, filter, table, tr, td, i, txtValue;
	input = document.getElementById("tableSearchInput");
	filter = input.value.toUpperCase();
	table = document.getElementById("tableSpace");
	tr = table.getElementsByTagName("tr");
  
	// Loop through all table rows, and hide those who don't match the search query
	for (i = 1; i < tr.length; i++) {
	  td0 = tr[i].getElementsByTagName("td")[0];
	  td1 = tr[i].getElementsByTagName("td")[1];

	  if (td0 || td1) {
		txtValue = (td0.textContent || td0.innerText) + '\t' + (td1.textContent || td1.innerText);
		if (txtValue.toUpperCase().indexOf(filter) > -1) {
		  tr[i].style.display = "";
		} else {
		  tr[i].style.display = "none";
		}
	  }
	}
  }

function parseData(url, callBack) {
	Papa.parse(url, {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function(results) {
			$('#cohort_select').hide();
			$('#cohort_table').show();
			callBack(results.data);
		}
	});
}

function jsonToCohortTable(data_json) {
	columns_array = [
		{title:"Select", field:"path", headerSort:false, width:80, formatter:function(cell, formatterParams, onRendered){
			if (cell.getValue().replace(/\/?$/, '/') == sessionStorage.getItem('path_val')){
				return '<button type="button" class="btn btn-success btn-sm">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-star" aria-hidden="true"></span></button>'; //return the contents of the cell;
			} else {
				return '<button type="button" class="btn btn-secondary disabled btn-sm" onclick="change_path_val(&quot;'+cell.getValue()+'&quot;)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</button>'; //return the contents of the cell;
			}
		}},
		//{title:"Chain", field:"name",headerFilter: true},
	]
	json_columns = Object.keys(data_json[0]);

	for (i = 2; i < json_columns.length; i++) { 
		if (json_columns[i].startsWith("#")){
			columns_array.push({title:json_columns[i].substr(1), field:json_columns[i], sorter:"number",headerFilter: true})
		} else {
			columns_array.push({title:json_columns[i], field:json_columns[i],headerFilter: true})
		}
		if (i == json_columns.length - 1){
			var table = new Tabulator("#cohort-select-table", {
				data:data_json,           //load row data from array
				//layout:"fitDataFill",
				layout:"fitColumns",      //fit columns to width of table
				responsiveLayout:"hide",  //hide columns that dont fit on the table
				tooltips:true,            //show tool tips on cells
				addRowPos:"top",          //when adding a new row, add it to the top of the table
				history:true,             //allow undo and redo actions on the table
				pagination:"local",       //paginate the data
				paginationSize:25,         //allow 7 rows per page of data
				//movableColumns:true,      //allow column order to be changed
				resizableRows:true,       //allow row order to be changed
				initialSort:[             //set the initial sort order of the data
					{column:"Author", dir:"asc"},
				],
				columns:columns_array
			});
		}
	}
}

function jsonToTable(data_json) {
	columns_array = [
		{title:"Sample", field:"sample",headerFilter: true, formatter:function(cell, formatterParams, onRendered){
			return '<B>'+cell.getValue()+'</B>'; //return the contents of the cell;
		}},
		{title:"Chain", field:"chain",headerFilter: true},
	]
	json_columns = Object.keys(data_json[0]);

	for (i = 2; i < json_columns.length; i++) { 
		columns_array.push({title:json_columns[i].split(' ').join('<br>'), field:json_columns[i], sorter:"number",formatter:function(cell, formatterParams, onRendered){
			return Number.parseFloat(cell.getValue()).toPrecision(3).replace(/\.0+$/,""); //return the contents of the cell;
		}},)
		if (i == json_columns.length - 1){
			var table = new Tabulator("#data-table", {
				data:data_json,           //load row data from array
				layout:"fitColumns",      //fit columns to width of table
				responsiveLayout:"hide",  //hide columns that dont fit on the table
				tooltips:true,            //show tool tips on cells
				addRowPos:"top",          //when adding a new row, add it to the top of the table
				history:true,             //allow undo and redo actions on the table
				pagination:"local",       //paginate the data
				paginationSize:25,         //allow 7 rows per page of data
				//movableColumns:true,      //allow column order to be changed
				resizableRows:true,       //allow row order to be changed
				initialSort:[             //set the initial sort order of the data
					{column:"sample", dir:"asc"},
				],
				columns:columns_array,
			});
		}
	}
}
