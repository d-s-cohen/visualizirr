function getUrlParameter(name) {
	name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
	var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
	var results = regex.exec(location.search);
	return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

var current_pathname = $(location).attr('pathname');

if (current_pathname.split('/').pop() == "cohort_analysis.html") {
	current_pathname = current_pathname.replace(/cohort_analysis.html$/, "index.html");
}

if ($(location).attr('pathname').split('/').pop() != "cohort_analysis.html") {
	$('#dropdown-populate').prepend('<a class="sampleSelect dropdown-item" id="All" href="' + current_pathname + "?sample=All" + location.hash + '">All</a>');
} else {
	$('#dropdown-populate').prepend('<a class="sampleSelect dropdown-item" id="All" href="' + current_pathname + '?sample=All">All</a>');

}

jQuery.get("data/sample_list.csv", function (data) {
	var lines = data.split("\n");
	if ($(location).attr('pathname').split('/').pop() != "cohort_analysis.html") {
		for (var i = 0; i < lines.length; i++) {
			$('#dropdown-populate').append('<a class="sampleSelect sampleSearch dropdown-item" id="' + lines[i] + '" href="' + current_pathname + "?sample=" + lines[i] + location.hash + '">' + lines[i] + '</a>');
		}
	} else {
		for (var i = 0; i < lines.length; i++) {
			$('#dropdown-populate').append('<a class="sampleSelect sampleSearch dropdown-item" id="' + lines[i] + '" href="' + current_pathname + "?sample=" + lines[i] + '">' + lines[i] + '</a>');
		}
	}
});

$(document).ready(function () {
	document.getElementById("info").setAttribute("href", "index.html?sample=" + current_sample);
	if (window.location.pathname.split('/').pop() != "cohort_analysis.html") {
		document.getElementById("segment_usage").setAttribute("href", "segment_usage.html?sample=" + current_sample + location.hash);
		document.getElementById("cdr3_length").setAttribute("href", "cdr3_length.html?sample=" + current_sample + location.hash);
	} else {
		document.getElementById("segment_usage").setAttribute("href", "segment_usage.html?sample=" + current_sample);
		document.getElementById("cdr3_length").setAttribute("href", "cdr3_length.html?sample=" + current_sample);
	}

	if (current_sample == "All") {
		document.getElementById("cohort_analysis").setAttribute("class", "nav-link nav-a");
		document.getElementById("cohort_analysis").parentElement.setAttribute("class", "nav-item active");
	}

});

var name = getUrlParameter('sample');

if (name == '') {
	$('#chosen_sample').text('All');
}
else {
	$('#chosen_sample').text(name);
}

//$('#myDropdown').on('show.bs.dropdown', function () {
//	// do something…
//  })

$(document).ready(function () {
	$("#searchSamples").on("keyup", function () {
		var value = $(this).val().toLowerCase();
		$(".sampleSearch").filter(function () {
			$(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
		});
	});
});

