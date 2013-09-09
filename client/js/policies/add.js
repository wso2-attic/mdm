$("#btn-add").click(function() {
	
	var policyName = $('#policyName').val();
	params = {};
	
	$(".policy-input").each(function(index) {
		
		var prefix = $(this).attr("id").split('-')[0];
		var suffix = $(this).attr("id").split('-')[1];		
		
				
		if(!params[prefix]){
			params[prefix] = new Object();
		}
		
		if($(this).attr('type') == 'checkbox'){	
			var param = params[prefix];			
			params[prefix][suffix] = $(this).is(':checked');			
		}else{
			var param = params[prefix];			
			params[prefix][suffix] = $(this).val();
		}
	});
	

	
	
		
	jQuery.ajax({
		url : getServiceURLs("policiesCRUD", ""),
		type : "POST",
		async : "false",
		data: JSON.stringify({params: params, policyName: policyName}),		
		contentType : "application/json",
		dataType : "json",		
	});
	
	noty({
		text : 'Permission Added successfully!',
		'layout' : 'center',
		'modal': false
	});
	
	//window.location.reload(true);
	
});