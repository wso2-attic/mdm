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

