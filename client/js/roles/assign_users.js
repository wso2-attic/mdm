$("#btn-add").click(function() {

	var groupName = $('#inputName').val();
	var users = $('#inputUsers').val();
	
	var tenantId = $('#tenantId').val();
	
	
	
	var usersArray = []
	if (users != null) {
		usersArray = users.toString().split(",");
	}
	

	var removedUsers = Array();
	
	//this is not a good thing to have it in the UI, but backend logic need it badly
	$("#inputUsers option").each(function(){ 
		if(usersArray.indexOf($(this).val()) < 0){
				 removedUsers.push($(this).val());
		}  		
	});
	
		
	jso = {
		"tenant_id" : tenantId,
		"name" : groupName,
		"added_users" : usersArray,
		"removed_users" : removedUsers
	};

	noty({
		text : 'Users assigned to groups successfully!',
		'layout' : 'center'
	});
	
	
	jQuery.ajax({
		url : getServiceURLs("groupsCRUD", groupName + "/users"),
		type : "PUT",
		async : "false",
		data : JSON.stringify(jso),
		contentType : "application/json",
		dataType : "json"
	});
	
	window.location.assign("configuration");

});


