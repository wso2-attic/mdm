
$("#btn-add").click(function() {
	
	$( 'form').parsley( 'validate' );	
	if(!$('form').parsley('isValid')){
		noty({
				text : 'Input validation failed!',
				'layout' : 'center',
				'type' : 'error'
		});		
		return;
	}

	var firstname = $('#inputFirstName').val();
	var lastname = $('#inputLastName').val();
	var type = $('#inputType').val();
	var username = $('#inputEmail').val();
	var password = $('#inputPassword').val();
	var mobileNo = $('#inputMobile').val();	
	
	var userMAMGroups = $('#inputMAMGroups').val();
	var tenantId = $('#tenantId').val();
	
	
	if($(".radioUserType:checked").val() == 'user'){
		var userGroups = $('#inputGroups').val();
	}else{
		var userGroups = $('#inputGroupsAdmins').val();
	}
	
	
	if(userGroups != null){
		if(userMAMGroups != null){
			userGroups = userGroups + "," + userMAMGroups;
		}
		
	}else{
		if(userMAMGroups != null){
			userGroups = userMAMGroups;
		}		
	}
	
	
	var userGroupsArray = []
	if (userGroups != null) {
		userGroupsArray = userGroups.toString().split(",");
	}
	
	
	//alert(userGroupsArray);
	
	// alert(JSON.stringify(userGroupsArray));
	jso = {
		"tenant_id" : tenantId,
		"username" : username,
		"password" : password,
		"first_name" : firstname,
		"last_name" : lastname,
		"mobile_no" : mobileNo,
		"type": type,
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


$( ".radioUserType" ).change(function() {
	var value = $(this).val();	
	//$(".inputGroupsSelect .box1 .filter").val(value);	
	//$(".inputGroupsSelect .box1 .filter" ).change();
	
	if(value == 'user'){
		$("#userSeletBox").css("display", "block");
		$("#adminSeletBox").css("display", "none");
	}else{
		$("#userSeletBox").css("display", "none");
		$("#adminSeletBox").css("display", "block");
	}
});



$( document ).ready(function() {
	//var value = 'user';	
	//$(".inputGroupsSelect .box1 .filter").val(value);	
	//$(".inputGroupsSelect .box1 .filter" ).change();
	
	$("#adminSeletBox").css("display", "none");
});