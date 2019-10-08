var current_pathname = $(location).attr('pathname');
// For cohort_analysis, don't assign URLs in page based off of current pathname
if (current_pathname.split('/').pop() == "cohort_analysis.html") {
	current_pathname = current_pathname.replace(/cohort_analysis.html$/, "index.html");
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