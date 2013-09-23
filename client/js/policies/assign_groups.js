$("#btn-add").click(function() {

	var id = $('#inputId').val();
	var groups = $('#inputGroups').val();
	
	var tenantId = $('#tenantId').val();
	
	
	
	var groupsArray = []
	if (groups != null) {
		groupsArray = groups.toString().split(",");
	}
	

	var removedGroups = Array();
	
	//this is not a good thing to have it in the UI, but backend logic need it badly
	$("#inputGroups option").each(function(){ 
		if(groupsArray.indexOf($(this).val()) < 0){
				 removedGroups.push($(this).val());
		}  		
	});
	
		
	jso = {
		"tenant_id" : tenantId,
		"id" : id,
		"added_groups" : groupsArray,
		"removed_groups" : removedGroups
	};

	

	jQuery.ajax({
		url : getServiceURLs("policiesCRUD", id + "/groups"),
		type : "PUT",
		async : "false",
		data : JSON.stringify(jso),
		contentType : "application/json",
		dataType : "json"
	});
	
	$( document ).ajaxComplete(function() {
		window.location.assign("configuration");
	});
	
	noty({
		text : 'Roles are assigned to policies successfully!',
		'layout' : 'center'
	});
	

});


