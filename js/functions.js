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
			  if ($('#' + content_id).find(".plotlyBar").length > 0) {
				  $('#' + content_id + '_nav').show();
				  if ($.inArray(types[location.hash], ['blank', '#' + content_id]) >= 0) {
					  $('#' + content_id).show();
				  }
				}  
		}, dataType = 'text');

    }).fail(function() { 

		console.log('#' + content_id)

		$("#" + $.escapeSelector(this_id)).parent().hide();

		var content_id = $(this).closest('.content_row').attr("id");
		$(this).closest('.col-6').remove();
		if (window.location.pathname.split('/').pop() == "cohort_analysis.html") {
			$(this).closest('.col').remove();
		}
		if ($('#' + content_id).find(".plotlyBar").length == 0) {
			$('#' + content_id).remove();
			$('#' + content_id + '_nav').remove();
			if (types[location.hash] == '#' + content_id) {
				window.location.replace(window.location.pathname.split('/').pop() + "?sample=" + current_sample);
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
			  if ($('#' + content_id).find(".plotlyBar").length > 0) {
				  $('#' + content_id + '_nav').show();
				  if ($.inArray(types[location.hash], ['blank', '#' + content_id]) >= 0) {
					  $('#' + content_id).show();
				  }
				}
		}, dataType = 'text');
    }).fail(function() { 

		$("#" + $.escapeSelector(this_id)).parent().hide();

		var content_id = $(this).closest('.content_row').attr("id");
		$(this).closest('.col-6').remove();
		if (window.location.pathname.split('/').pop() == "cohort_analysis.html") {
			$(this).closest('.col').remove();
		}
		if ($('#' + content_id).find(".plotlyBar").length == 0) {
			$('#' + content_id).remove();
			$('#' + content_id + '_nav').remove();
			if (types[location.hash] == '#' + content_id) {
				window.location.replace(window.location.pathname.split('/').pop() + "?sample=" + current_sample);
			}
		}
    })

}


function save_img(div_name, file_format, file_name){

	Plotly.downloadImage(div_name, {format: file_format, width: 1200, height: 900, filename: file_name});

}
