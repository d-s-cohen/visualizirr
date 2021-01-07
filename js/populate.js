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

	var i = setInterval(function () {
		if (sessionStorage.length) {
			clearInterval(i);
			parseData(data_path + "intracohort_data.csv", jsonToTable);
			$("#statsCSV").attr('href', data_path + "intracohort_data.csv");
			$.ajax({
				url: data_path + "meta.csv",
				type:'HEAD',
				success: function()
				{
					$('#cohortMetaTable').attr('style','');
					parseData(data_path + "meta.csv", jsonToMetaTable);
					$("#metaCSV").attr('href', data_path + "meta.csv");
				}
			});
		}
	}, 100);
});
}
