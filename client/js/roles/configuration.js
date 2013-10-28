var selectedGroup = null;

treeData = null;




$("#btn-add-features").click(function() {
	
	 selNodes = null
	 
	 $("#tree3").dynatree("getRoot").visit(function (node) {
        selNodes = node.tree.getSelectedNodes();        
     });
     
    
     featureList = Array();     
     var selKeys = $.map(selNodes, function(node1){            
            if(!node1.data.isFolder){
            	featureList.push(node1.data.value);
            }
            
     });	
     
    	
	var bundleName = $('#inputBundleName').val();
		
	
	jQuery.ajax({
		url : getServiceURLs("permissionsCRUD", ""),
		type : "PUT",
		async : "false",
		data: JSON.stringify({selectedGroup: selectedGroup, featureList: featureList}),		
		contentType : "application/json",
		dataType : "json",
		error: function(datas){
	       	
	       					if (datas.status == 200) {

									noty({
										text : 'Permission Added success!',
										'layout' : 'center',
										'modal' : false
									});
									

								} else {

									noty({
										text : 'Permission assigning failed!',
										'layout' : 'center',
										'modal' : false,
										type : 'error'
									});

									
								}  	
	       	
	    }		
	});
	
	
	
});



$(".add-permission-link").click(function() {	
	selectedGroup = $(this).data("group");	
	$('#assign-permission-heading').html("Assign permissions to " + selectedGroup);

});



$(".btn-item-remove").click(function() {
	var item = $(this).data("item");
		
	noty({
		text : 'Are you sure you want delete this role?',
		buttons : [{
			addClass : 'btn btn-cancel',
			text : 'Cancel',
			onClick : function($noty) {
				$noty.close();

			}
			
			
		}, {
			
			addClass : 'btn btn-orange',
			text : 'Ok',
			onClick : function($noty) {
				
				jQuery.ajax({
					url : getServiceURLs("groupsCRUD", item),
					type : "DELETE",					
					contentType : "text/plain"
			
				}).done(function() {
					$noty.close();
					window.location.reload(true);
				});
			}
			
		}]
	});	


});


$(".btn-invite").click(function() {
	
	var item = $(this).data("item");
		
	noty({
		text : 'Are you sure you want invite this group?',
		buttons : [{
			addClass : 'btn btn-cancel',
			text : 'Cancel',
			onClick : function($noty) {
				$noty.close();

			}
			
			
		}, {
			
			addClass : 'btn btn-orange',
			text : 'Ok',
			onClick : function($noty) {				
				$noty.close();
				
				jQuery.ajax({
					url : getServiceURLs("groupsInvite"),
					type : "PUT",					
					data : {username: item},		
					contentType : "application/json",
			     	dataType : "json",
			     	statusCode: {
						400: function() {
							noty({
								text : 'Error occured!',
								'layout' : 'center',
								'type': 'error'
							});
						},
						404: function() {
							noty({
								text : 'API not found',
								'layout' : 'center',
								'type': 'error'
							});
						},
						500: function() {
							noty({
								text : 'Fatal error occured!',
								'layout' : 'center',
								'type': 'error'
							});
						},
						200: function() {
							noty({
								text : 'Group is invited successfully!',
								'layout' : 'center'
							});
							window.location.assign("configuration");
						}
					}
			
				});
				
				
				
				
				
			}
			
		}]
	});
	
	
});





