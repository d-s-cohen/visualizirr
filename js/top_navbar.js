function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

var current_pathname = $(location).attr('pathname');

jQuery.get("cohort/sample_list.csv", function(data) {
	var lines = data.split("\n");
	for(var i = 0; i < lines.length; i++) {
		$('#dropdown-populate').append('<a class="sampleSelect dropdown-item" id="'+lines[i]+ '" href="' + current_pathname + "?sample=" + lines[i] + location.hash +'">'+lines[i]+'</a>');
	 }
 });

//var current_pathname = $(location).attr('pathname');
//$('.sampleSelect').attr("href", function() {return current_pathname + "?sample=" + $(this).attr("id") + location.hash});

$(document).ready( function() {	

	document.getElementById("sample_info").setAttribute("href","sample_info.html?sample="+current_sample);
	document.getElementById("segment_usage").setAttribute("href","segment_usage.html?sample="+current_sample+location.hash);
	document.getElementById("cdr3_length").setAttribute("href","cdr3_length.html?sample="+current_sample+location.hash);

}) ;		

	var name = getUrlParameter( 'sample' ) ;
	if ( name == '' )
	{
		jQuery.get("cohort/sample_list.csv", function(data) {
			var lines = data.split("\n");
		$('#chosen_sample').text( lines[0] ) ;
	});
	}
	else
	{
		$('#chosen_sample').text( name ) ;
	}

$('#myDropdown').on('show.bs.dropdown', function () {
	// do something…
  })

$(document).ready(function () {
	$("#searchSamples").on("keyup", function () {
		var value = $(this).val().toLowerCase();
		$(".sampleSelect").filter(function () {
			$(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
		});
	});
});

