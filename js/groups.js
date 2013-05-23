$(document).ready(function() {    	
  	//loadCustomGroups();
  	loadGroups();
  	loadAllFeatures(); 
});

var operation = "";
var operation_id = 0;
var group_id = 0;
var operation_template = "false";
var no_of_devices = 0;



function getServerURL(){
	return "/mdm";
}


function loadAllFeatures(){
	
	jQuery.ajax({
	      url: getServerURL() + "/features", 
	      type: "GET",
	      dataType: "json",
	      success: function(features) 
	      {  	    	 
	    	
	    	var outputString = "";
	    	
	    	for(var i = 0; i < features.length; i++){
	    		
	    		if(features[i].feature_type != "OPERATION"){
	    			continue;
	    		}
	    		
	    	
	    	
	    	//template = jQuery.parseJSON(features[i].template);
	    	
	    		var template = null;	
	    	  	
	    	  	if(features[i].template != null){
	    	  		template = jQuery.parseJSON(features[i].template);
	    	  	}
	    	  	
	    	  	var hasTemplate = "false";
	    	  	
	    	  	if(template != null){
	    	  		hasTemplate = "true";
	    	  	}
	    	  	
	    	  	
	    	  	outputString += '<li class="features-li"><a draggable="true" href="#"><img cmdtemplate="' + hasTemplate + '" cmdid="' + i + '" cmd="' + features[i].name + '" class="feature-icon" src="img/features/' + features[i].name + '.png"> '+features[i].description+'</a></li> ';

	    	  	
	    	  	 if(template != null){
	    		  
					  outputString +=    '<div id="featureModal-'+ i +'" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'+
						  							'<div class="modal-header">'+
						   									'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'+
	    				 									'<h3 id="myModalLabel">'+features[i].description+'</h3>'+					  
						  							'</div>';
						  
						  	outputString += 	'<div class="modal-body">';
						  	
						  			var hasButtons = false;
						  	
						  			for(var j = 0; j < template.fields.length; j++){
						  				
						  							var component = template.fields[j];						  							
						  							
						  							outputString += 	'<div class="row-fluid">';
						  							
						  							
						  							
						  							if(component.type == "text"){
						  								outputString += '<label class="text">' +	
																		 component.title + ': <input id="feature-param-'  + i + '-'  + j + '" type="text"> ' + 
																	'</label>';
						  							} 
						  							
						  							if(component.type == "password"){
						  								outputString += '<label class="password">' +	
																		 component.title + ': <input id="feature-param-'  + i + '-'  + j + '" type="password"> ' + 
																	'</label>';
						  							} 
						  							
						  							if(component.type == "button"){
						  								hasButtons = true;
						  								outputString += '<label class="text">' +	
																		'<input data-dismiss="modal" id="operation-button-' + features[i].name + '" class="btn" type="button" value="'+ component.title + '"> ';
																	'</label>';
						  							}  	
						  							
						  							outputString += 	'</div>';														
						  			}
						  	
						  								  
					  		outputString +=	'</div>';
					  		
					  		
					  		 
					  		 if(!hasButtons){
					  		 	outputString +=	'<div class="modal-footer">' +														
														'<button data-dismiss="modal" id="operation-button-' + features[i].name + '" class="btn btn-primary">OK</button>' +
														'<button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>' +
													'</div>';
					  		 }
					  		 
					  		
							outputString +=	'</div>';
							
							
					 		
							
	    		  }// end of if check
	    		  
	    		  
	    		  
	    		  
	    		  if(template == null){
	    				template = jQuery.parseJSON('{"fields":[]}');
	    			}
	    		 
	    		   $('#device-features-list').on('click',  '#operation-button-' + features[i].name, { operation: features[i].name, i:i, feature_type:features[i].feature_type, template:JSON.stringify(template)  }, function (e) {	    		  		
	    		  		
	    		  		 
	    		  		  var data = {};
	    		  		   var params = {};    		  		 
	    		  		
	    		  			    		  			    		  			    		  		
	    		  		 if(e.data.template != null){ 
	    		  		 	
	    		  		 	    		  		 	
	    		  		 	var template = jQuery.parseJSON(e.data.template);	    		  		 	
	    		  		 	  		  			
	    		  			
	    		  			 
	    		  			  for (var j = 0; j < template.fields.length; j++) {
	    		  			  	
	    		  			  	 if(template.fields[j].type == "text" || template.fields[j].type == "password"){	    		  			  	 	 
	    		  			  	 	 params[template.fields[j].id] = $('#feature-param-'  + e.data.i + '-'  + j).val();	    		  			  	 	 
	    		  			  	 	
	    		  			  	 }
	    		  			  	 
	    		  			  	 if(template.fields[j].type == "button"){
	    		  			  	 	params["function"] = $(this).val();		    		  			  	 
	    		  			  	 	break;
	    		  			  	 }	
	    		  			  	    		  			  	 
	    		  			  }
	    		  			 
	    		  			  			 
	    		  			  
	    		  		 }
	    		  		 
	    		  		 
	    		  		  data["data"] = params;
	    		  		 operationURL = getServerURL()  + "/groups/" + group_id + "/operations/" + e.data.operation;	    		  		 
	    		  		
	    		  		
	    		  		operationDoPost(operationURL, data);
	    		  		 
	    		  		
	    		  		
	    		  		
	    		  	});	  
	    		  
	    		  
	    		  
	    		  
	    	
	    	
	    	}
	    	
	    	
	    	
	    	$('#device-features-list').html(outputString);
	    	var currentHTML = "";
	    	
	    	$('#device-features-list').find('.features-li').draggable(
	    		{revert: true,
	    			 start: function() {
	    				currentHTML = $(this).html();
	    				var imageIco = $(this).find(".feature-icon").attr("src");
	    				operation =  $(this).find(".feature-icon").attr("cmd");
	    				operation_id =  $(this).find(".feature-icon").attr("cmdid");
	    				operation_template =  $(this).find(".feature-icon").attr("cmdtemplate");   							
	    				
                       $(this).html('<img src="' + imageIco + '">');                      
                     
                },
                
                 stop: function() {	    				
                       $(this).html(currentHTML);                       
                }
                
                
                 });
	    	
	      },
	      error: function(jqXHR, textStatus, errorThrown){          
	          alert('Error: Feature List Found' + errorThrown);
	      }   
	  });
}



function loadGroups(){
	jQuery.ajax({
	      url: getServerURL() + "/webconsole/devices", 
	      type: "GET",
	      dataType: "json",
	      success: function(groups) 
	      {  	    	 
	    	
	    	var outputString = "";
	    	
	    	for(var i = 0; i < groups.length; i++){
	    		
	    		outputString += '<div devicecount="'+ groups[i].no_of_devices + '" groupid="'+ groups[i].id + '"  id="group-box-'+ i + '" href="#modal-group-'+ i + '" data-toggle="modal" class="user-groups span3">'+
									'<div class="raw-fluid text-center user-groups-header">'+
										'<img class="groups-icon" style="width:30px" src="img/groups.png"><b>'+ groups[i].name +'</b>'+
									'</div>'+
									
									'<div class="raw-fluid">'+
										'<ul class="user-groups-body">'+
											'<li><img src="img/oneuser.png" style="width:20px"> '+ groups[i].no_of_users +' Users</li>'+
											'<li><img src="img/device.png" style="width:20px">'+ groups[i].no_of_devices +' Devices</li>'+
										'</ul>'+
									'</div>';					
								
								
				outputString +=	'</div>';			
								
				//madalbox
				
				outputString +=    '<div id="modal-group-'+ i + '" style="display:none" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'+
											  '<div class="modal-header">'+
											    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'+
											    '<h3 id="myModalLabel">'+ groups[i].name +'</h3>'+
											  '</div>'+
											  '<div style="height:500px;" class="modal-body">'+
											  		'<h3>Select Users</h3>'+
											  		'<div id="modal-group-body-'+ i + '" class="modal-body">'+
											  		
											  		'</div>'+
											    	
											  '</div>'+
											 
											'</div>';
											
											
					//end of groupbox div		
					
			
			//$('#user-groups').on('drop', '#group-box-'+ i , {group_id: groups[i].id}, function (e) {
			//	alert("hi")
			//});
							
			
			//$('#user-groups').find('.user-groups').droppable({
	       //         over: function() {
	       //                 alert('working!');
	       //         }
        	//});
        	
        	
											
											
			$('#user-groups').on('click', '#group-box-'+ i , {group_id: groups[i].id}, function (e) {	
				
				
							jQuery.ajax({
						      url: getServerURL() + "/groups/" + e.data.group_id + "/users", 
						      type: "GET",
						      dataType: "json",
						      success: function(users) 
						      { 
						      	//alert(users[0].name);
						      	
						      	
						      	if(users.length > 0){
						      			var usersString = '<ul id="device-features-list" class="user-list"><li><h5>Users <div style="float:right">Devices</div></h5></li>';
								      	
								      	for(var j = 0; j < users.length; j++){
								      		if(users[j].no_of_devices > 0){
								      			usersString += '<li><img src="img/oneuser.png" style="width:10px"> <a href="users_devices.jag?user=' + users[j].id + '">' + users[j].first_name + ' ' +  users[j].last_name  + '</a><div style="float:right" >' + users[j].no_of_devices +  '<img style="width:20px" src="img/device.png"></div></li>';
								      		}else{
								      			usersString += '<li><img src="img/oneuser.png" style="width:10px">' + users[j].first_name + ' ' +  users[j].last_name  + '<div style="float:right" >' + users[j].no_of_devices +  '<img style="width:20px" src="img/device.png"></div></li>';
								      		}
								      		
								      	}
								      	
								      	usersString += '</ul>';
								      	
								      	$('#user-groups').find('.modal-body').html(usersString);
								      	
								      	
								      	
								      
						      	}
						      
						      	
						    	
						      },
						      error: function(jqXHR, textStatus, errorThrown){          
						          //alert('Error: User List' + errorThrown);
						          $('#user-groups').find('.modal-body').html("No users found in this  group");
						      }   
						  });
				
								   		  		
	    		  		
	    	});									
															
								
	    	}
	    	
	    	
	    	
	    	$('#user-groups').html(outputString);
	    	
	    	
	    	
	    	$('#user-groups').find('.user-groups').droppable({
	    		tolerance: "pointer",
                drop: function() {
                     // alert(operation_template);
                      // $(this).html("hi");
                     group_id = $(this).attr("groupid");
                     no_of_devices = $(this).attr("devicecount");  
                    
                     
                                          
                     if(operation_template == "false"){
                     	 operationURL = getServerURL()  + "/groups/" + group_id + "/operations/" + operation;                     
                     	 operationDoPost(operationURL, "{}");	
                     }
                    	  		 
	    		  			    		  		  
                                      
                     $("#featureModal-" + operation_id).modal('show');
                }
        	});
	    	
	    	
	    	
	    	
	    	
	      },
	      error: function(jqXHR, textStatus, errorThrown){          
	          alert('Error: Groups Not Found' + errorThrown);
	      }   
	  });
}






function operationDoPost(operationURL, params){
	
	//alert(operationURL + JSON.stringify(params));
	
	var answer = confirm(no_of_devices + " devices will be affected.\n Are you sure you want to perform this operation?");
	if (answer){
		$.pnotify({			
			text: operation + ' Operation request sent to the devices'
					  
	 });
	
	
	 jQuery.ajax({
	      url: operationURL,  
	      type: "POST",
	      data: JSON.stringify(params),
	      contentType: "application/json",
	      dataType: "json",
		  async: "false"	
	       
	  });
	}
	
}






































function loadCustomGroups(){
	jQuery.ajax({
	      url: "http://localhost:9763/MDM/API/groups.jag", 
	      type: "GET",
	      dataType: "json",
	      success: function(groups) 
	      {  	    	 
	    	
	    	var outputString = "";
	    	
	    	for(var i = 0; i < groups.length; i++){
	    		
	    		outputString += '<div ondrop="drop(event)" id="group-box-'+ i + '" href="#modal-group-'+ i + '" data-toggle="modal" class="user-groups-custom span2" >'+
									'<div class="raw-fluid text-center user-groups-header-custom">'+
										'<img class="groups-icon" src="img/groups.png"> <b>'+ groups[i].name +'</b>'+
									'</div>'+
									
									'<div class="raw-fluid">'+
										'<ul class="user-groups-body-custom">'+
											'<li>'+ groups[i].no_of_users +' Users</li>'+
											'<li>'+ groups[i].no_of_devices +' Devices</li>'+
										'</ul>'+
									'</div>';					
								
								
				outputString +=	'</div>';			
								
				//madalbox
				
				outputString +=    '<div id="modal-group-'+ i + '" style="display:none" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'+
											  '<div class="modal-header">'+
											    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'+
											    '<h3 id="myModalLabel">'+ groups[i].name +'</h3>'+
											  '</div>'+
											  '<div style="height:500px;" class="modal-body">'+
											  		'<h3>Select Users</h3>'+
											  		'<div id="modal-group-body-'+ i + '">'+
											  		
											  		'</div>'+
											    	
											  '</div>'+
											 
											'</div>';
											
											
					//end of groupbox div		
					
			
					
											
											
			$('#user-groups-custom').on('click', '#group-box-'+ i , {group_id: groups[i].id}, function (e) {	
				
				
							jQuery.ajax({
						      url: "http://localhost:9763/MDM/API/users_list.jag?group=" + e.data.group_id, 
						      type: "GET",
						      dataType: "json",
						      success: function(users) 
						      { 
						      	//alert(users[0].name);
						      	
						      	
						      	if(users.length > 0){
						      			var usersString = '<ul id="device-features-list" class="user-list">';
								      	
								      	for(var j = 0; j < users.length; j++){
								      		usersString += '<li><a href="users_devices.jag?user=' + users[j].id + '">' + users[j].first_name + ' ' +  users[j].last_name  + '</a></li> ';
								      	}
								      	
								      	usersString += '</ul>';
								      	
								      	$('#user-groups').find('.modal-body').html(usersString);
						      	}
						      
						      	
						    	
						      },
						      error: function(jqXHR, textStatus, errorThrown){          
						          alert('Error: User List' + errorThrown);
						      }   
						  });
				
								   		  		
	    		  		
	    	});									
															
								
	    	}
	    	
	    	
	    	
	    	$('#user-groups-custom').html(outputString);
	    	
	    	
	    	
	    	
	    	
	    	
	    	
	    	
	    	
	      },
	      error: function(jqXHR, textStatus, errorThrown){          
	          alert('Error: Feature List Found' + errorThrown);
	      }   
	  });
}






function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}


