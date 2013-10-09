oTable = $('#main-table').dataTable({
		"sDom" : "<'row-fluid'<'tabel-filter-group span8'T><'span4'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
		"bProcessing" : true,
		"bServerSide" : true,
		"bFilter" : false,
		
		aoColumns: [
                      
                      null,
                      null,

                      {                         
                        "fnRender": function (oObj)                              
                        {                           
                            return "<a href='/mdm/users/devices?user="  + oObj.aData[2] + "'>"+  oObj.aData[2] +"</a>";
                        }
                      },
                      
                       null,

                   ],	
		"sAjaxSource" : "/mdm/config/test/dummy_devices.json?",
		"fnServerParams": function ( aoData ) {
          	var roles = $('#inputRoles').val();
			var user = $('#inputUser').val();
			var ownership = $('#inputOwnership').val();
			var os = $('#inputOS').val();
			
            aoData.push( { "name": "role", "value": roles } );
            aoData.push( { "name": "user", "value": user } );
            aoData.push( { "name": "ownership", "value": ownership } );
            aoData.push( { "name": "os", "value": os } );
        }
		
	});



$("#btn-find").click(function() {
	oTable.fnDraw();
});


$( "#featureList" ).change(function() {
	
	var operation = $(this).val();
	
	var nFiltered = oTable.fnGetData();
	
	var devices = new Array();
	
	for(var i = 0; i < nFiltered.length; i++){		
		if (isNaN(nFiltered[i][0]) == false){
			devices.push(nFiltered[i][0]);
			
		}
	}
			
	
	noty({
		text : 'Are you sure you want to perform this operation on selected devices?',
		buttons : [{
			addClass : 'btn btn-cancel',
			text : 'Cancel',
			onClick : function($noty) {
				$noty.close();
				$('#featureList').msDropDown().data('dd').setIndexByValue("");		
			}
			
			
		}, {
			
			addClass : 'btn btn-orange',
			text : 'Ok',
			onClick : function($noty) {

				jQuery.ajax({
					url : getServiceURLs("performGroupsOperation"),
					type : "POST",
					async : "false",
					data : JSON.stringify({operation: operation, devices: devices}),
					contentType : "application/json",
					dataType : "json"					

				});

				noty({
					text : 'Operation is sent to the devices successfully!',
					'layout' : 'center',
					'modal': false
					
				});

				$noty.close();

			}
			
		}]
	});
	
	
	
	
	
	
	
	
	
});

