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
types['#PSCA'] = '#content_PSCA';
types['#OL'] = '#content_ol';
types['#CIT'] = '#content_cit';
types['#CT'] = '#content_ct';
types['#CS'] = '#content_cs';
types[''] = 'blank';

// Associate location hash with content IDs
var plot_labels = {};
plot_labels['cdr3aaLength'] = ['CDR3 amino acid length distribution', 'CDR3 Length, AA', 'Frequency', 'Clonotype'];
plot_labels['cdr3ntLength'] = ['CDR3 nucleotide length distribution', 'CDR3 Length, bp', 'Count'];
plot_labels['vsumBarplot'] = ['V Gene Usage', 'V Gene', 'Frequency'];
plot_labels['dsumBarplot'] = ['D Gene Usage', 'D Gene', 'Frequency'];
plot_labels['jsumBarplot'] = ['J Gene Usage', 'J Gene', 'Frequency'];
plot_labels['csumBarplot'] = ['C Gene Usage', 'C Gene', 'Frequency'];
plot_labels['vjStackBar'] = ['V-J Gene Usage', 'V Gene', 'Frequency', 'J Gene'];

// Get current sample value from URL
var current_sample = new URL(location.href).searchParams.get('sample');
if (current_sample == null) {
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
				data_path = sessionStorage.getItem('path_val');
				location.reload();
			}, dataType = 'text');
		}
		$('.plotlyBar').each(function () { load_plotly_bar(data_path, $(this).attr("id")); });
		$('.plotlyStackedBar').each(function () { load_plotly_stacked_bar(data_path, $(this).attr("id")); });
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
			data_path = sessionStorage.getItem('path_val');
			location.reload();
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

		$.ajax({
			url: "img/overview.png",
			type:'HEAD',
			success: function()
			{ $('#overview-figure').attr('style',''); }
		});

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

		d3.text("home.md").then(function (data) {
			var md = window.markdownit();
			$('#markdown').html(md.render(data));
		});

		parseData("cohort_table.csv", jsonToCohortTable);

	});
}

// Populate information table from info.csv
if ($.inArray(window.location.pathname.split('/').pop(), ['cohort_analysis.html']) >= 0) {
	$(document).ready(function () {
		var data_path = 'data/'
		if (sessionStorage.getItem('path_val') != null) {
			data_path = sessionStorage.getItem('path_val')
		} else {
			jQuery.get("cohort_list.csv", function (data) {
				var path_val = data.split("\n")[0].split(",")[0]
				path_val = path_val.replace(/\/?$/, '/');
				sessionStorage.setItem('path_val', path_val);
				data_path = sessionStorage.getItem('path_val');
				location.reload();
			}, dataType = 'text');
		}

		let data_sheet = {};
		data_sheet[null] = 'intracohort_data.csv';
		data_sheet['db'] = 'db_data.csv';
		let data_sheet_url = data_sheet[new URL(location.href).searchParams.get('data')];
		parseData(data_path + data_sheet_url, jsonToTable);
		$("#statsCSV").attr('href', data_path + data_sheet_url);
		$.ajax({
			url: data_path + "meta.csv",
			type: 'HEAD',
			success: function () {
				$('#cohortMetaTable').attr('style', '');
				parseData(data_path + "meta.csv", jsonToMetaTable);
				$("#metaCSV").attr('href', data_path + "meta.csv");

				parseData(data_path + "meta.csv", jsonToSampleSelectTable);

			},
			error: function () {
				populate_page();
				$('#heatmapDiv').parent().hide();
				$('#sample-selection-button').hide();
			}
		});
	});
}


if ($.inArray(window.location.pathname.split('/').pop(), ['cohort_analysis.html']) >= 0) {

	$(document).on('click', '.btn-export', function () {

		var xval_in = parseInt($(this).parent().find('.xval-in').val());
		if (isNaN(xval_in)) {
			xval_in = parseInt($(this).parent().find('.xval-in').prop("defaultValue"));
		}
		var yval_in = parseInt($(this).parent().find('.yval-in').val());
		if (isNaN(yval_in)) {
			yval_in = parseInt($(this).parent().find('.yval-in').prop("defaultValue"));
		}
		var plotlyDiv = $(this).parent().find('.js-plotly-plot').attr('id');
		var exportName = plotlyDiv.replace("Div", "_plot");
		if ($(this).hasClass('save-png')) {
			var save_format = 'png';
		} else if ($(this).hasClass('save-svg')) {
			var save_format = 'svg';
		}

		save_img(plotlyDiv, save_format, exportName, xval_in, yval_in)

		//console.log(plotlyDiv, save_format, exportName, xval_in, yval_in);

	});

} else {

	$(document).on('click', '.btn-export', function () {

		var xval_in = parseInt($(this).parent().parent().find('.xval-in').val());
		if (isNaN(xval_in)) {
			xval_in = parseInt($(this).parent().parent().find('.xval-in').prop("defaultValue"));
		}
		var yval_in = parseInt($(this).parent().parent().find('.yval-in').val());
		if (isNaN(yval_in)) {
			yval_in = parseInt($(this).parent().parent().find('.yval-in').prop("defaultValue"));
		}
		var plotlyDiv = $(this).parent().parent().find('.js-plotly-plot').attr('id');
		var exportName = current_sample + '_' + plotlyDiv.replace(".csv", "").replace("/", "_").replace("Div", "");
		if ($(this).hasClass('save-png')) {
			var save_format = 'png';
		} else if ($(this).hasClass('save-svg')) {
			var save_format = 'svg';
		}

		save_img(plotlyDiv, save_format, exportName, xval_in, yval_in)

		//console.log(plotlyDiv, save_format, exportName, xval_in, yval_in);

	});

}
