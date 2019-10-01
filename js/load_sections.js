$(document).ready( function() {	
	if ($.inArray(window.location.pathname.split('/').pop(), ['index.html', 'cohort_analysis.html', '']) >= 0) {
		$('#top_navbar').load('top_navbar_all.html') ;
	} else if ($(location).attr('search').split('=').pop() == "All") {
		$('#top_navbar').load('top_navbar_all.html') ;
	} else {
		$('#top_navbar').load('top_navbar.html') ;
	}
	$('#footer').load('footer.html') ;
	}) ;	