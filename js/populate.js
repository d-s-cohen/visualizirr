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
types['#DYN1'] = '#content_dynplot1';
types['#DYN2'] = '#content_dynplot2';
types['#CDR3'] = '#content_CDR3';
types[''] = 'blank';
// Get current sample value from URL
var current_sample = $(location).attr('search').split('=').pop();
if (current_sample == "") {
	current_sample = "All";
}
// Populate figures based off of sample ID
if ($.inArray(window.location.pathname.split('/').pop(), ['segment_usage.html', 'cdr3_length.html']) >= 0) {
	$(document).ready(function () {
		$('.imageLink').attr("href", function () { return "data/" + current_sample + "/" + $(this).attr("id") });
		$('.imageEmbed').attr("src", function () { return "data/" + current_sample + "/" + $(this).attr("id") });
		$(".imageEmbed").on("error", function () {
			var content_id = $(this).closest('.content_row').attr("id");
			$(this).closest('.col-6').remove();
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
if ($.inArray(window.location.pathname.split('/').pop(), ['index.html', '']) >= 0) {
	$(document).ready(function () {
		if (current_sample == "All") {
			$("#info_title").text("Cohort Info");
		} else {
			$("#info_title").text("Sample Info");
		}
	});
	d3.text("data/" + current_sample + "/info.csv", function (data) {
		var parsedCSV = d3.csv.parseRows(data);
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
