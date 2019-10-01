function hide_others(fragment) {
	$('.content_row').hide();
	$(types[fragment]).show();
	if (window.location.pathname.split('/').pop() != "cohort_analysis.html") {
		$('.sampleSelect').attr("href", function () { return current_pathname + "?sample=" + $(this).attr("id") + fragment });
		$('#cdr3_length').attr("href", function () { return "cdr3_length.html?sample=" + current_sample + fragment });
		$('#segment_usage').attr("href", function () { return "segment_usage.html?sample=" + current_sample + fragment });
	}
}

function show_all() {
	$('.content_row').show();
	if (window.location.pathname.split('/').pop() != "cohort_analysis.html") {
		$('.sampleSelect').attr("href", function () { return current_pathname + "?sample=" + $(this).attr("id") });
		$('#cdr3_length').attr("href", function () { return "cdr3_length.html?sample=" + current_sample });
		$('#segment_usage').attr("href", function () { return "segment_usage.html?sample=" + current_sample });
	}
}