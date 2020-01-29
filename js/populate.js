// Associate location hash with content IDs
var types = {};
types['#TRA'] = '#content_tra';
types['#TRB'] = '#content_trb';
types['#TRG'] = '#content_trg';
types['#TRD'] = '#content_trd';
types['#IGH'] = '#content_igh';
types['#IGL'] = '#content_igl';
types['#IGK'] = '#content_igk';
types['#TCR'] = '#content_tcr';
types['#BCR'] = '#content_bcr';
types['#PCA'] = '#content_pca';
types['#DIV'] = '#content_diversity';
types['#ICA'] = '#content_ICA';
types[''] = 'blank';
// Get current sample value from URL
var current_sample = $(location).attr('search').split('=').pop();
if (current_sample == "") {
	current_sample = "All";
}
// Populate figures based off of sample ID
if ($.inArray(window.location.pathname.split('/').pop(), ['segment_usage.html', 'cdr3_length.html', "cohort_analysis.html"]) >= 0) {
	$(document).ready(function () {
		var data_path = 'data/'
		if (sessionStorage.getItem('path_val') != null) {
			data_path = sessionStorage.getItem('path_val')
		} else {
			jQuery.get("cohort_list.csv", function (data) {
				var path_val = data.split("\n")[0].split(",")[0]
				path_val = path_val.replace(/\/?$/, '/');
				sessionStorage.setItem('path_val', path_val);
				data_path = sessionStorage.getItem('path_val')
			}, dataType = 'text');
		}
		$('.imageLink').attr("href", function () { return data_path + current_sample + "/" + $(this).attr("id") });
		$('.imageEmbed').attr("src", function () { return data_path + current_sample + "/" + $(this).attr("id") });
		$(".imageEmbed").on("error", function () {
			var content_id = $(this).closest('.content_row').attr("id");
			$(this).closest('.col-6').remove();
			if (window.location.pathname.split('/').pop() == "cohort_analysis.html") {
				$(this).closest('.col').remove();
			}
			if ($('#' + content_id).find('img').length == 0) {
				$('#' + content_id).remove();
				$('#' + content_id + '_nav').remove();
				if (types[location.hash] == '#' + content_id) {
					window.location.replace(window.location.pathname.split('/').pop() + "?sample=" + current_sample);
				}
			}
		});
		$(".imageEmbed").on("load", function () {
			var content_id = $(this).closest('.content_row').attr("id");
			if ($('#' + content_id).find('img').length > 0) {
				$('#' + content_id + '_nav').show();
				if ($.inArray(types[location.hash], ['blank', '#' + content_id]) >= 0) {
					$('#' + content_id).show();
				}
			}
		});
	});
}
// Populate information table from info.csv
if ($.inArray(window.location.pathname.split('/').pop(), ['info.html']) >= 0) {
	$(document).ready(function () {
		if (current_sample == "All") {
			$("#info_title").text("Cohort Info");
		} else {
			$("#info_title").text("Sample Info");
		}
	});
	var data_path = 'data/'
	if (sessionStorage.getItem('path_val') != null) {
		data_path = sessionStorage.getItem('path_val')
	} else {
		jQuery.get("cohort_list.csv", function (data) {
			var path_val = data.split("\n")[0].split(",")[0]
			path_val = path_val.replace(/\/?$/, '/');
			sessionStorage.setItem('path_val', path_val);
			data_path = sessionStorage.getItem('path_val')
		}, dataType = 'text');
	}
	d3.text(data_path + current_sample + "/info.csv").then(function (data) {
		var parsedCSV = d3.csvParseRows(data);
		var container = d3.select("#tableSpace")
			.selectAll("tr")
			.data(parsedCSV).enter()
			.append("tr")

			.selectAll("td")
			.data(function (d) { return d; }).enter()
			.append("td")
			.text(function (d) { return d; });
	});
}

if ($.inArray(window.location.pathname.split('/').pop(), ['index.html', '']) >= 0) {
	$(document).ready(function () {

		if (sessionStorage.getItem('path_val') == null) {
			jQuery.get("cohort_list.csv", function (data) {
				var path_val = data.split("\n")[0].split(",")[0]
				path_val = path_val.replace(/\/?$/, '/');
				sessionStorage.setItem('path_val', path_val);
				$('#path_field').attr('value', sessionStorage.getItem('path_val'));
			}, dataType = 'text');
			if (sessionStorage.getItem('path_val') == null) {
				sessionStorage.setItem('path_val', 'data/');
				$('#path_field').attr('value', sessionStorage.getItem('path_val'));
			}
		} else {
			$('#path_field').attr('value', sessionStorage.getItem('path_val'));
		}

		$('#path_select').on('click', function () {
			var path_val = $('#path_field').val();
			path_val = path_val.replace(/\/?$/, '/');
			sessionStorage.setItem('path_val', path_val);
			location.reload();
		});

		jQuery.get("cohort_list.csv", function (data) {
			var lines = data.split("\n");
			for (var i = 0; i < lines.length; i++) {
				$("#cohort_select").append("<button type='button' class='btn btn-outline-secondary btn-sm mr-1' onclick='change_path_val(&quot;" + lines[i].split(",")[0] + "&quot;)'>" + lines[i].split(",")[1] + "</button>");
			}
		}, dataType = 'text');

		d3.text("README.md").then(function (data) {
			var md = window.markdownit();
			$('#markdown').html(md.render(data));
		});
	});
}
