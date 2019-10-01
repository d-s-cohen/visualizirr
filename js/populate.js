
if ($.inArray(window.location.pathname.split('/').pop(), ['segment_usage.html', 'sample_info.html', 'cdr3_length.html']) >= 0) {
	var current_sample = $(location).attr('search').split('=').pop();
	if (current_sample == "") {
		jQuery.get("cohort/sample_list.csv", function(data) {
			var lines = data.split("\n");
			current_sample = lines[0];
	});
	}
}

if ($.inArray(window.location.pathname.split('/').pop(), ['segment_usage.html', 'cdr3_length.html']) >= 0) {
	$(document).ready( function() {	
		if (current_sample == "") {
			jQuery.get("cohort/sample_list.csv", function(data) {
				var lines = data.split("\n");
				current_sample = lines[0];
				$('.imageLink').attr("href", function() {return "samples/" + current_sample + "/" + $(this).attr("href")});
				$('.imageEmbed').attr("src", function() {return "samples/" + current_sample + "/" + $(this).attr("src")});
				$('.pdfEmbed').attr("data", function() {return "samples/" + current_sample + "/" + $(this).attr("data")});
		});
	} else {
		$('.imageLink').attr("href", function() {return "samples/" + current_sample + "/" + $(this).attr("href")});
		$('.imageEmbed').attr("src", function() {return "samples/" + current_sample + "/" + $(this).attr("src")});
		$('.pdfEmbed').attr("data", function() {return "samples/" + current_sample + "/" + $(this).attr("data")});
	}
	}) ;	
}

if ($.inArray(window.location.pathname.split('/').pop(), ['sample_info.html']) >= 0) {
	if (current_sample == "") {
		jQuery.get("cohort/sample_list.csv", function(data2) {
			var lines = data2.split("\n");
			current_sample = lines[0];
	d3.text("samples/" + current_sample+"/info.csv", function(data) {
		var parsedCSV = d3.csv.parseRows(data);
		var container = d3.select("#tableSpace")
			.selectAll("tr")
				.data(parsedCSV).enter()
				.append("tr")

			.selectAll("td")
				.data(function(d) { return d; }).enter()
				.append("td")
				.text(function(d) { return d; });
			});
	});
} else {
	d3.text("samples/" + current_sample+"/info.csv", function(data) {
		var parsedCSV = d3.csv.parseRows(data);
		var container = d3.select("#tableSpace")
			.selectAll("tr")
				.data(parsedCSV).enter()
				.append("tr")

			.selectAll("td")
				.data(function(d) { return d; }).enter()
				.append("td")
				.text(function(d) { return d; });
	});
}
}

if ($.inArray(window.location.pathname.split('/').pop(), ['index.html', '']) >= 0) {
	d3.text("cohort/info.csv", function(data) {
		var parsedCSV = d3.csv.parseRows(data);
		var container = d3.select("#tableSpace")
			.selectAll("tr")
				.data(parsedCSV).enter()
				.append("tr")

			.selectAll("td")
				.data(function(d) { return d; }).enter()
				.append("td")
				.text(function(d) { return d; });
				
	});
}

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

if ($.inArray(window.location.pathname.split('/').pop(), ['segment_usage.html', 'cdr3_length.html']) >= 0) {
	$(document).ready( function() {	
if (location.hash == ""){	
	$('.content_row').show();
} else {	
	$('.content_row').hide();
	$(types[location.hash]).show();
	}
}) ;
}