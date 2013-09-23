$("#btn-add").click(function() {
	
	var policyName = $('#policyName').val();
	var policyType = $('#policyType').val();
	params = {};
	
	$(".policy-input").each(function(index) {
		
		var prefix = $(this).attr("id").split('-')[0];
		var suffix = $(this).attr("id").split('-')[1];		
		
				
		if(!params[prefix]){
			params[prefix] = new Object();
		}
		
		var param = params[prefix];	
		
		if($(this).attr('type') == 'checkbox'){	
			
			if($(this).is(':checked')){
				var checkVal = $(this).data("trueVal");
				if(checkVal !== ""){
					params[prefix]["function"] = checkVal;
				}
			}else{
				var checkVal = $(this).data("falseVal");
				if(checkVal !== ""){
					params[prefix]["function"] = checkVal;
				}
			}	
				
		}else{	
			if($(this).val() !== ""){
				params[prefix][suffix] = $(this).val();
			}			
			
		}
	});
	

	//alert(params.length);
	
	var policyData =  Array();
	
	for (var param in params) {     	
     	policyData.push({code: param, data: params[param]});
	}

	
		
	jQuery.ajax({
		url : getServiceURLs("policiesCRUD", ""),
		type : "POST",
		async : "false",
		data: JSON.stringify({policyData: policyData, policyName: policyName, policyType: policyType}),		
		contentType : "application/json",
     	dataType : "json"		
	});
	
	noty({
		text : 'Policies added successfully!',
		'layout' : 'center',
		'modal': false
	});
	
	$( document ).ajaxComplete(function() {
		window.location.assign("configuration");
	});
	
});