$("#btn-add").click(function() {

	var name = $('#inputName').val();
	var users = $('#inputUsers').val();
	var tenantId = $('#tenantId').val();

	var usersArray = []
	if (users != null) {
		usersArray = users.toString().split(",");
	}
	// alert(JSON.stringify(userGroupsArray));
	jso = {
		"tenant_id" : tenantId,
		"name" : name,
		"users" : usersArray
	};

	noty({
		text : 'Group Added successfully!',
		'layout' : 'center'
	});

	jQuery.ajax({
		url : getServiceURLs("groupsCRUD", ""),
		type : "POST",
		async : "false",
		data : JSON.stringify(jso),
		contentType : "application/json",
		dataType : "json"
	});

});


