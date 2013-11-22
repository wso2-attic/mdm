var selectedUser = null;

$(document).ready(function() {
	oTable = $('#main-table').dataTable({
		"sDom" : "<'row-fluid'<'tabel-filter-group span8'T><'span4'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
		"iDisplayLength" : 10,		
		"bStateSave" : false,
		 "aoColumnDefs": [
					  {
					     bSortable: false,
					     aTargets: [ -1 ]
					  }
		],
		"oTableTools" : {
			"aButtons" : ["copy", "print", {
				"sExtends" : "collection",
				"sButtonText" : 'Save <span class="caret" />',
				"aButtons" : ["csv", "xls", "pdf"]
			}]
		}
	});
	
	
	$(".tabel-filter-group").html("Type: " + fnCreateSelect( oTable.fnGetColumnData(3)));
	
	$('.tabel-filter-group select').change( function () {
            oTable.fnFilter( $(this).val(), 3 );
     } );
	
	

});



function fnCreateSelect( aData ){
    var r='<select><option value="">--All--</option>', i, iLen=aData.length;
    for ( i=0 ; i<iLen ; i++ )
    {
        r += '<option value="'+aData[i]+'">'+aData[i]+'</option>';
    }
    return r+'</select>';
}
 


$(".add-group-link").click(function() {
	selectedUser = $(this).data("user");
	$('#assign-group-heading').html("Assign groups to " + selectedUser);

});

$(".btn-item-remove").click(function() {
	var item = $(this).data("item");
		
	noty({
		text : 'Are you sure you want delete this user?',
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
					url : getServiceURLs("usersCRUD", item),
					type : "DELETE",					
					contentType : "text/plain",
					statusCode: {
						400: function() {
							noty({
								text : 'Error occured!',
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
								text : 'User is unassigned successfully!',
								'layout' : 'center'
							});
							window.location.assign("configuration");
						}
					}
					
			
				}).done(function() {
					$noty.close();					
				});
			}
			
		}]
	}); 	


});



$(".btn-invite").click(function() {
	
	var item = $(this).data("item");
		
	noty({
		text : 'Are you sure you want invite this user?',
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
				
				var n = noty({
								text : 'Inviting user, please wait....',
								'layout' : 'center',
								timeout: false
											
				});
				
					
				jQuery.ajax({
					url : getServiceURLs("usersInvite"),
					type : "PUT",					
					data : JSON.stringify({'userid': item}),		
					contentType : "application/json",
			     	dataType : "json",
			     	statusCode: {
						400: function() {
							n.close();
							noty({
								text : 'Error occured!',
								'layout' : 'center',
								'type': 'error'
							});
						},
						500: function() {
							n.close();
							noty({
								text : 'Fatal error occured!',
								'layout' : 'center',
								'type': 'error'
							});
						},
						200: function() {
							n.close();
							noty({
								text : 'invitation is sent to user successfully!',
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
 



$("#btn-assign-group").click(function() {
	$('#assign-group-heading').html("Assign groups to " + selectedUser);
	var userGroups = $('#inputGroups').val();
	var userGroupsArray = []
	if (userGroups != null) {
		userGroupsArray = userGroups.toString().split(",");
	}

	jQuery.ajax({
		url : getServiceURLs("usersCRUD", ""),
		type : "PUT",
		async : "false",
		data : JSON.stringify({
			user : selectedUser,
			groups : userGroupsArray
		}),
		contentType : "application/json",
		dataType : "json",
		success : function(appList) {
			alert(appList);
			noty({
				text : 'Groups are assigned to the user successfully!',
				'layout' : 'center'
			});
		},
		error : function(xhr, textStatus, errorThrown) {
			noty({
				text : xhr.responseText,
				'layout' : 'center'
			});
		}
	});
}); 