$(function () {
	var i = setInterval(function () {
		if ($('#navBar').length) {
			clearInterval(i);
			// Wait until navbar is loaded
			var current_pathname = $(location).attr('pathname');
			// For cohort_analysis, don't assign URLs in page based off of current pathname
			if (current_pathname.split('/').pop() == "cohort_analysis.html") {
				current_pathname = current_pathname.replace(/cohort_analysis.html$/, "cdr3_length.html");
			} else if ($.inArray(window.location.pathname.split('/').pop(), ["index.html", ""]) >= 0) {
				current_pathname = "cdr3_length.html"
			}
			// Prepend 'All" selection to dropdown menu
			if ($.inArray(window.location.pathname.split('/').pop(), ["cohort_analysis.html", "index.html", ""]) == -1) {
				$('#dropdown-populate').prepend('<a class="sampleSelect dropdown-item" id="All" href="' + current_pathname + "?sample=All" + location.hash + '">All</a>');
			} else {
				$('#dropdown-populate').prepend('<a class="sampleSelect dropdown-item" id="All" href="' + current_pathname + '?sample=All">All</a>');
			}
			// Populate sample selection based off of sample_list.csv
			var sample_list_path = "data/sample_list.csv"
			if (sessionStorage.getItem('path_val') != null) {
				var path_val = sessionStorage.getItem('path_val')
				var sample_list_path = path_val + "sample_list.csv"
			} else {
				jQuery.get("cohort_list.csv", function (data) {
					var path_val = data.split("\n")[0].split(",")[0]
					path_val = path_val.replace(/\/?$/, '/');
					sessionStorage.setItem('path_val', path_val);
					sample_list_path = path_val + "sample_list.csv"
				  }, dataType = 'text');
			}
			jQuery.get(sample_list_path, function (data) {
				var lines = data.split("\n");
				if ($.inArray(window.location.pathname.split('/').pop(), ["cohort_analysis.html", "index.html", ""]) == -1) {
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
				$("#info").attr("href", "info.html?sample=" + current_sample);
				if ($.inArray(window.location.pathname.split('/').pop(), ["cohort_analysis.html", "index.html", ""]) == -1) {
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
					$('#cohort_analysis_expanded_button').prop('disabled', false);
				}
				// db data availability
				$.ajax({
					url: path_val + "db_data.csv",
					type: 'HEAD',
					error: function () {
						$('#cohort_analysis').show();
					},
					success: function () {
						$('#cohort_analysis_expanded').show();
					}
				});
				
			});
			// Current sample display on dropdown
			$('#chosen_sample').text(current_sample);
			// Search dropdown samples
			$(document).ready(function () {
				$("#searchSamples").on("keyup", function () {
					var value = $(this).val().toLowerCase();
					$(".sampleSearch").filter(function () {
						$(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
					});
				});
			});
			
			$.get(path_val + current_sample + "/info.csv")
			.done(function () {
				$('#info').show();
			});

			// Show cohort name
			$(document).ready(function () {
				if (sessionStorage.getItem('path_val') != "data/" && sessionStorage.getItem('path_val') != null) {
					$("#header_desc").text(sessionStorage.getItem('path_val').split("/")[sessionStorage.getItem('path_val').split("/").length - 2] + " Immune Repertoire");
				}
			});
		}
	}, 100);
});
