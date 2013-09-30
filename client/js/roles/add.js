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
	

	var name = $('#inputName').val();
	var type = $('#inputType').val();
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
		"type" : type,
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
	
	$( document ).ajaxComplete(function() {
		window.location.assign("configuration");
	});

});


$( ".radioGroupType" ).change(function() {
	var value = $(this).val();	
	$(".box1 .filter").val(value);	
	$(".box1 .filter" ).change();
});


$( document ).ready(function() {
	var value = 'user';	
	$(".box1 .filter").val(value);	
	$(".box1 .filter" ).change();
});