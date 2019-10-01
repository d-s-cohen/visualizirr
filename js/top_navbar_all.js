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
		$('#dropdown-populate').append('<a class="sampleSelect dropdown-item" id="'+lines[i]+ '" href="' + "sample_info.html" + "?sample=" + lines[i] + '">'+lines[i]+'</a>');
	 }
 });


$(document).ready( function() {	
	
	var name = getUrlParameter( 'sample' ) ;
	if ( name == '' )
	{
		$('#chosen_sample').text( 'All samples' ) ;
	}
	else
	{
		$('#chosen_sample').text( name ) ;
	}
}) ;	

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


