$("#btn-add").click(function() {
	
	var policyName = $('#policyName').val();
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

	var policyId = $(this).data("policyId");
		
	jQuery.ajax({
		url : getServiceURLs("policiesCRUD", policyId),
		type : "PUT",
		async : "false",
		data: JSON.stringify({policyData: policyData, policyName: policyName}),		
		contentType : "application/json",
     	dataType : "json"		
	});
	
	noty({
		text : 'Policies changed successfully!',
		'layout' : 'center',
		'modal': false
	});
	
	$( document ).ajaxComplete(function() {
	//	window.location.assign("configuration");
	});
	
});



$(document).ready( function () {
	
	policyId = getURLParameter("policy");	
	
	jQuery.ajax({
		url : getServiceURLs("policiesCRUD", policyId),
		type : "GET",
		dataType : "json",
		success : function(policyData) {
			//policyData = policyData[0];			
			$("#policyName").val(policyData.name);	
			policyContent = JSON.parse(policyData.content);				
			for( var i = 0; i < policyContent.length; i++){
				var code = policyContent[i].code;
				var data = policyContent[i].data;				
				$.each( data, function( key, value ) {
					if($("#" + code + "-" + value).attr('type') == "checkbox"){
						$("#" + code + "-" + value).prop('checked', true);
					}else{
						$("#" + code + "-" + key).val(value);
					}
					
				});
				
				
			}
			
					
		}
	});

		
	
	
	
} );