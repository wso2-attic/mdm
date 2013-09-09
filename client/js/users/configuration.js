var selectedUser = null;

$(document).ready( function () {
	oTable = $('#main-table').dataTable( {
		"sDom": "<'row-fluid'<'tabel-filter-group span8'T><'span4'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
		"iDisplayLength": 6,
		 "bStateSave": false,
		"oTableTools": {
			"aButtons": [
				"copy",
				"print",
				{
					"sExtends":    "collection",
					"sButtonText": 'Save <span class="caret" />',
					"aButtons":    [ "csv", "xls", "pdf" ]
				}
			]
		}
	} );
	
} );


$(".add-group-link").click(function() {
	selectedUser = $(this).data("user");
	$('#assign-group-heading').html("Assign groups to " + selectedUser);
	

});




$("#btn-assign-group").click(function() {	
	$('#assign-group-heading').html("Assign groups to " + selectedUser);
	var userGroups = $('#inputGroups').val();
	var userGroupsArray = []
	if (userGroups != null) {
		userGroupsArray = userGroups.toString().split(",");
	}

	
	jQuery.ajax({
		url : getServiceURLs("usersCRUD", ""),
		type : "PUT",
		async : "false",
		data : JSON.stringify({user: selectedUser, groups: userGroupsArray}),
		contentType : "application/json",
		dataType : "json",
		success : function(appList) {alert(appList);
			noty({
				text : 'Groups are assigned to the user successfully!',
				'layout' : 'center'
			});
		},error: function(xhr, textStatus, errorThrown){
	       	noty({
				text : xhr.responseText,
				'layout' : 'center'
			});
	    }
	});
});