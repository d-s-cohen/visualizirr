$(function () {
	var i = setInterval(function () {
		if ($('#navBar').length) {
			clearInterval(i);
			// Wait until navbar is loaded
			var current_pathname = $(location).attr('pathname');
			// For cohort_analysis, don't assign URLs in page based off of current pathname
			if ($.inArray(window.location.pathname.split('/').pop(), ["cohort_analysis.html", "help.html"]) >= 0) {
				current_pathname = current_pathname.replace(/cohort_analysis.html$/, "index.html");
				current_pathname = current_pathname.replace(/help.html$/, "index.html");
			}
			// Prepend 'All" selection to dropdown menu
			if ($.inArray(window.location.pathname.split('/').pop(), ["cohort_analysis.html", "help.html"]) == -1) {
				$('#dropdown-populate').prepend('<a class="sampleSelect dropdown-item" id="All" href="' + current_pathname + "?sample=All" + location.hash + '">All</a>');
			} else {
				$('#dropdown-populate').prepend('<a class="sampleSelect dropdown-item" id="All" href="' + current_pathname + '?sample=All">All</a>');
			}
			// Populate sample selection based off of sample_list.csv
			if (sessionStorage.getItem('path_val') != null) {
				var path_val = sessionStorage.getItem('path_val')
				var sample_list_path = path_val + "sample_list.csv"
			} else {
				var sample_list_path = "data/sample_list.csv"
			}
			jQuery.get(sample_list_path, function (data) {
				var lines = data.split("\n");
				if ($.inArray(window.location.pathname.split('/').pop(), ["cohort_analysis.html", "help.html"]) == -1) {
					for (var i = 0; i < lines.length; i++) {
						$('#dropdown-populate').append('<a class="sampleSelect sampleSearch dropdown-item" id="' + lines[i] + '" href="' + current_pathname + "?sample=" + lines[i] + location.hash + '">' + lines[i] + '</a>');
					}
				} else {
					for (var i = 0; i < lines.length; i++) {
						$('#dropdown-populate').append('<a class="sampleSelect sampleSearch dropdown-item" id="' + lines[i] + '" href="' + current_pathname + "?sample=" + lines[i] + '">' + lines[i] + '</a>');
					}
				}
			}, dataType = 'text');
			// Modify navbar links based off current URL
			$(document).ready(function () {
				$("#info").attr("href", "index.html?sample=" + current_sample);
				if ($.inArray(window.location.pathname.split('/').pop(), ["cohort_analysis.html", "help.html"]) == -1) {
					$("#segment_usage").attr("href", "segment_usage.html?sample=" + current_sample + location.hash);
					$("#cdr3_length").attr("href", "cdr3_length.html?sample=" + current_sample + location.hash);
				} else {
					$("#segment_usage").attr("href", "segment_usage.html?sample=" + current_sample);
					$("#cdr3_length").attr("href", "cdr3_length.html?sample=" + current_sample);
				}
				// Toggle Cohort Analysis link
				if (current_sample == "All") {
					$("#cohort_analysis").attr("class", "nav-link nav-a");
					$("#cohort_analysis_status").attr("class", "nav-item active");
				}
			});
			// Current sample display on dropdown
			if (current_sample == '') {
				$('#chosen_sample').text('All');
			}
			else {
				$('#chosen_sample').text(current_sample);
			}
			// Search dropdown samples
			$(document).ready(function () {
				$("#searchSamples").on("keyup", function () {
					var value = $(this).val().toLowerCase();
					$(".sampleSearch").filter(function () {
						$(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
					});
				});
			});
		}
	}, 100);
});
