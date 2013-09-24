$("#btn-add").click(function() {
	
	$( 'form').parsley( 'validate' );	
	if(!$('form').parsley('isValid')){
		noty({
				text : 'Data cannot be validated!',
				'layout' : 'center',
				'type' : 'error'
		});		
		return;
	}

	var firstname = $('#inputFirstName').val();
	var lastname = $('#inputLastName').val();
	var username = $('#inputEmail').val();
	var password = $('#inputPassword').val();
	var mobileNo = $('#inputMobile').val();
	var userGroups = $('#inputGroups').val();
	var tenantId = $('#tenantId').val();
	
	var userGroupsArray = []
	if (userGroups != null) {
		userGroupsArray = userGroups.toString().split(",");
	}
	// alert(JSON.stringify(userGroupsArray));
	jso = {
		"tenant_id" : tenantId,
		"username" : username,
		"password" : password,
		"first_name" : firstname,
		"last_name" : lastname,
		"mobile_no" : mobileNo,
		"groups" : userGroupsArray
	};	
	
	noty({
				text : 'User Added successfully!',
				'layout' : 'center'
	});
	
	jQuery.ajax({
		url : getServiceURLs("usersCRUD", ""),
		type : "PUT",
		async : "false",
		data : JSON.stringify(jso),		
		contentType : "application/json",
     	dataType : "json"				
	});
	
	$( document ).ajaxComplete(function() {
		window.location.assign("configuration");
	});

});