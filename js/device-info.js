var device_id = 0;
var one_operation = true;

var page_loaded = true;


function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}


function getServerURL(){
	return "/mdm";
}

function displayUserData(id){	
	
	userId = getURLParameter("user");
	
	jQuery.ajax({
	      url: getServerURL() + "/users/" + userId,  
	      type: "GET",
	      dataType: "json",
	      success: function(user) 
	      {  	    	 
	    	  $("#name-of-the-user").text(user.first_name + " " + user.last_name);
	    	  displayDeviceInfo(user.id);
	      },
	      error: function(jqXHR, textStatus, errorThrown){          
	              $.pnotify({
					    title: 'User not found',
					    text: 'No user associate with this ID',
					    type: 'error'
				  });
	      }   
	  });
}

function displayDeviceInfo(userId){
	
	var tabId =0;
	
	jQuery.ajax({
	      url: getServerURL() + "/users/"+ userId +"/devices", 
	      type: "GET",
	      dataType: "json",
	      success: function(devices) 
	      {  	    	 
	    	 
	    	 	    	  
	    	  if(devices.length > 0){
	    		  $("#devices-info").append('<div id="devices-info-tabs" class="tabbable"></div>');
	    		  
	    		  	//adding devices tabs
	    		    $("#devices-info-tabs").append('<ul id="devices-tabs-heading" class="nav nav-tabs"></ul>');
	    		    //adding devices tabs content
	    		    $("#devices-info-tabs").append('<div id="devices-tabs-content" class="tab-content"></div>');
	    		    
	    		    
					device_id = devices[0].id;
	    		    
	    		  	for (var i = 0; i < devices.length; i++) {
	    		  		$("#devices-tabs-heading").append('<li><a deviceid="'+ devices[i].id +'" href="#device-'+ i +'" data-toggle="tab">' + jQuery.parseJSON(devices[i].properties).model + '</a></li>');    		  	  
	    		  	} 		  	
	    		  	
	    		  	$('#devices-info a[data-toggle="tab"]:first').tab('show'); 
	    		  	
	    		  	for (var i = 0; i < devices.length; i++) {
	    		  		var active = (i == 0)? "fade in active" : "";
	    		  		//var online = (devices[i].online == "1") ? "online" : "offline";
	    		  		var online = "online";
	    		  		
	    		  		$("#devices-tabs-content").append('<div deviceid="'+ devices[i].id +'" class="tab-pane ' + active + '" id="device-'+ i +'"></div>');
	    		  		
	    		  		
	    		  		var properties = jQuery.parseJSON(devices[i].properties);
	    		  		var properitesString = "";
	    		  		
	    		  		
	    		  		for (var key in properties) {
	    		  			
	    		  			if(key){
	    		  				 properitesString += '<div class="row-fluid">' +
													'<b>' + key + ' : </b> ' + properties[key] +
										       '</div>';
	    		  			}
						} 
	    		  		
	    		  		$("#device-" + i).append('<div class="row-fluid">' +
	    		  				
	    		  				'<div class="span4">' +		    		  				
	    		  				
	    		  					//device information block
	    		  					'<div class="row-fluid">' +
		    		  						'<div class="block">' +		    		  					
													'<div class="navbar navbar-inner block-header">' +
														'<div class="block-header pull-left">' +
															'<b>Device Info</b>' +
														'</div>' +
														'<div class="pull-right" data-toggle="tooltip" title="' + online + '">' +
															'<img id="device-info-online" src="img/' + online + '-icon.png">' +
														'</div>' +
													'</div>' + //end of block header
											
											
													'<div class="block-content collapse in">' +
											
															
															'<div class="span12">' +
															
																'<div class="row-fluid">' +
																	'<div class="span12 text-center">' +																		
																		'<img id="device-info-img"  onerror="this.src = \'img/models/none.png\'" src="img/models/' + jQuery.parseJSON(devices[i].properties).model +'.png" />' +
																	'</div>' +
																'</div>' +
				
																'<div id="device-info-description" class="row-fluid">' +
																	'<div class="span12 offset1">' +
																	
																		properitesString +
																		
																	'</div>' +
																'</div>' +
																
															'</div>' + //end of span 12										
											
													'</div>' + //end of block content
											
												'</div>' + //end of block    		  				
	    		  					'</div>' + //end of row fluid  device info
	    		  					
	    		  					
	    		  					'<div class="row-fluid">' +										
										'<div class="block">' +
											'<div class="navbar navbar-inner block-header">' +
												'<div class="block-header pull-left">' +
													'<b>Latest Notifications</b>' +
												'</div>' +											
											'</div>' +
											'<div class="block-content collapse in">' +
												'<div id="device-notifications-' + i + '" class="span12">' +												
													//notifications should load here
												'</div>' +
											'</div>' +
										'</div>' +									
								   '</div>' + //end of row fluid  notifications    		  					
	    		  					
	    		  					
	    		  					
	    		  				'</div>' + //end of span4
	    		  				
	    		  				
	    		  				
	    		  				
	    		  				
	    		  				
	    		  				'<div class="span8">' +
	    		  				
	    		  				
	    		  				
	    		  				
	    		  					'<div id="row-fluid">' + 
		    		  					'<div class="block">' +
											'<div class="navbar navbar-inner block-header">' +
												'<div class="block-header pull-left">' +
													'<b>Apps Installed</b>' +
												'</div>' +
												'<div class="pull-right">' +
												
												
												'<a href="#" id="btn-devices-refresh-apps" class="btn btn-medium"><i class="icon-refresh"></i></a>' +
												
												
												
												
												'</div>' +
											'</div>' +
											'<div id="device-applications-' + i + '" class="block-content collapse in">' +
			    		  					
			    		  					'</div>' +
		    		  					'</div>' +	    		  					
	    		  					'<div>' +
	    		  				
	    		  				
	    		  					'<div id="row-fluid">' + 
		    		  					'<div class="block">' +
											'<div class="navbar navbar-inner block-header">' +
												'<div class="block-header pull-left">' +
													'<b>Device Information</b>' +
												'</div>' +
												'<div class="pull-right">' +
													'<a href="#" id="btn-devices-refresh-geninfo" class="btn btn-medium"><i class="icon-refresh"></i></a>' +
												'</div>' +
											'</div>' +
											'<div id="device-geninfo-' + i + '" class="block-content collapse in">' +
			    		  					
			    		  					'</div>' +
		    		  					'</div>' +	    		  					
	    		  					'<div>' +
	    		  					
	    		  					
	    		  					
	    		  					
	    		  					
	    		  					
	    		  					
	    		  					'<div class="row-fluid">' +									
											'<div class="block">' +
												'<div class="navbar navbar-inner block-header">' +
													'<div class="block-header pull-left">' +
														'<b>Operations</b>' +
													'</div>' +													
												'</div>' +
												'<div id="device-features-' + i + '" class="block-content collapse in" style="padding:40px"></div>' +												
											'</div>' +									
	    		  					'</div>' +
	    		  					
	    		  					
	    		  					
		    		  				
	    		  					
	    		  					
	    		  					
	    		  					
	    		  					
	    		  					
	    		  					
	    		  					
	    		  				'</div>' +	//end of span8
	    		  				
	    		  				
	    		  				
	    		  				
	    		  				
	    		  		'<div>');//end of tab main row fluid
	    		  		
	    		  		   		  		
	    		  	}
	    		  	
	    		  	    		  	
	    		  	loadDeviceInformation(0, devices);	    		  	
	    		  	$('#devices-info').on('show', 'a[data-toggle="tab"]', function (e) {
	    		  		device_id = $(this).attr("deviceid");	    		  		    		  		    		  		
	    		  		tabId = e.target.toString().split('-').pop();
	    		  		page_loaded = false;
	    		  		loadDeviceInformation(tabId, devices);
	    		  	});	    		  	
	    		  	
	    		  	    		  	
	    		  	$('#devices-info').on('click', '#btn-devices-refresh-geninfo', function (e) {	    		  		
	    		  		loadGeneralInformation(tabId, devices);
	    		  	});
	    		  	
	    		  	$('#devices-info').on('click', '#btn-devices-refresh-apps', function (e) {	    		  		
	    		  		loadApplications(tabId, devices);
	    		  	});
	    		  	
	    		  	$('#devices-info').on('click', '#btn-devices-refresh-features', function (e) {	
	    		  		
	    		  		loadFeatures(tabId, devices);
	    		  	});		  	
	    		  	
	    		  
	    		  	
	    		  	

	    	  }  
	    	  
	    	  
	    	  
	      },
	      error: function(jqXHR, textStatus, errorThrown){          
	           	$.pnotify({
					    title: 'Devices not found',
					    text: 'No devices found for this user'
					  
				  });
	      }   
	  });
}





$(document).ready(function() {  
  id = 1;
  displayUserData(id);  
});



function loadDeviceInformation(id, devices){
	loadNotifications(id, devices);	
	loadFeatures(id, devices);		
  	loadGeneralInformation(id, devices);
  	loadApplications(id, devices);
}


function loadNotifications(id, devices){	
	
	jQuery.ajax({
	      url: getServerURL() + "/notifications/devices/" + devices[id].id,  
	      type: "GET",
	      dataType: "json",
	      success: function(notifications) 
	      {
	    	 
	    	  notificationsString = '<div class="row-fluid">';
	    	  
	    	  notificationsString += '<table class="table table-hover">' +	
	    	  
	    	  			'</tr>'+
	    		  		'<th>Operations</th>'+
	    		  		'<th>Sent</th>'+
	    		  		'<th>Received</th>'+
	    		  		//'<th>Status</th>'+
	    		  		'</tr>';    	  
	    	
	    	 
	    	  for (var i = 0; i < notifications.length; i++) {
	    	  	
	    	  		
	    	  		if(notifications[i].feature_description == null){
	    	  			continue;
	    	  		}
	    	  	
	    		  notificationsString += ''+
	    		  
	    				'</tr>'+
	    		  		'<td>' + notifications[i].feature_description + '</td>'+
	    		  		'<td>' + checkForNullMakeBlank(notifications[i].sent_date) + '</td>'+
	    		  		'<td>' + checkForNullMakeBlank(notifications[i].received_date) + '</td>'+
	    		  		//'<td>' + notifications[i].status + '</td>'+
	    		  		'</tr>';
	    		  
	    		  
	    		  
	    		  		  
  		  	  }
  		  	  
  		  	  notificationsString += '</table>';	
  		  	  notificationsString += '</div>';    	  
	    	 
	    	  $("#device-notifications-" + id).html(notificationsString);
	    	  
	      },
	      error: function(jqXHR, textStatus, errorThrown){          
	          alert('Failed to retrieve notifications');
	      } 
	});
	
}




function loadGeneralInformation(id, devices){
	
		
	jQuery.ajax({
	      url: getServerURL() + "/refresh/devices/" + devices[id].id+"/500A",  
	      type: "GET",
	      dataType: "json",
	      success: function(info) 
	      {
	    	 
	    	  	    	  
	    	  var receivedData = jQuery.parseJSON(info.received_data);
	    	  
	    	  notificationsString = "";    	 	    		  
	    		  
	    		  notificationsString +=	'<div class="span2">';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	'<img style="height:60px" src="img/info/battery.png">';
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	 "Battery Level: " + receivedData.battery.level.toFixed(2) + "%";
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=    '</div>';
	    		  
	    		  
	    		   notificationsString +=	'<div class="span2">';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	'<img style="height:60px" src="img/info/external_memory.png">';
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	 "External Memory: " + bytesToSize(receivedData.external_memory.available, 0) + " of " + bytesToSize(receivedData.external_memory.total, 0);
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=    '</div>';
	    		  
	    		  
	    		  notificationsString +=	'<div class="span2">';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	'<img style="height:60px" src="img/info/internal_memory.png">';
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	 "Internal Memory: " + bytesToSize(receivedData.internal_memory.available, 0) + " of " + bytesToSize(receivedData.internal_memory.total, 0);
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=    '</div>';
	    		  
	    		  
	    		  notificationsString +=	'<div class="span2">';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	'<img style="height:60px" href="#modelMap-'+ id + '" data-toggle="modal" src="img/info/location.png">';
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	 "Location";
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=    '</div>';  
	    		  
	    		   
	    		  notificationsString +=	'<div class="span2">';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	'<img style="height:60px" src="img/info/simcard.png">';
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=	'<div class="row text-center">';
	    		  notificationsString +=	 "Operator: ";
	    		  for (var key in receivedData.operator) {
	    		  	 	notificationsString +=	 receivedData.operator[key];
	    		  	 	if(key < (receivedData.operator.length -1)){
	    		  	 		notificationsString += ", ";
	    		  	 	}
	    		  }	    		 
	    		  notificationsString +=	'</div>';
	    		  notificationsString +=    '</div>';     		  
	    		  
	    		  
	    		  
				 
	    		  
						notificationsString +=    '<div id="modelMap-'+ id + '" style="display:block" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'+
											  '<div class="modal-header">'+
											    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'+
											    '<h3 id="myModalLabel">Location</h3>'+
											  '</div>'+
											  '<div id="map_canvas-'+ id + '" style="height:500px;" class="modal-body">'+
											    
											  '</div>'+
											 
											'</div>';
	    		  
	    		  
		  	    	    
	    	 
	    	  $("#device-geninfo-" + id).html(notificationsString);
	    	  
	    	    if(receivedData.location_obj.latitude == 0){
	    	    	receivedData.location_obj.latitude = "6.9123661";
	    	    }
	    	    
	    	    if(receivedData.location_obj.longitude == 0){
	    	    	receivedData.location_obj.longitude = "79.8525739";
	    	    }
	    	  
	    		  $('#map_canvas-'+ id).gmap().bind('init', function(ev, map) {
						$('#map_canvas-'+ id).gmap('addMarker', {'position': receivedData.location_obj.latitude + "," + receivedData.location_obj.longitude, 'bounds': true}).click(function() {
							$('#map_canvas-'+ id).gmap('openInfoWindow', {'content': 'Location'}, this);
						});
					});
										
	    	  
	      },
	      error: function(jqXHR, textStatus, errorThrown){          
	          //alert('Failed to retrieve device status');
	      } 
	});
}


function loadApplications(id, devices){
	
	jQuery.ajax({
	      //url: getServerURL() + "/refresh/devices/"+ devices[id].id +"/502A",
	      url: getServerURL() + "/refresh/devices/"+ devices[id].id +"/502A",  
	      type: "GET",
	      dataType: "json",
	      success: function(apps) 
	      {
	    	 
	    	  //notificationsString = "";
	    	  
	    	  var receivedData = jQuery.parseJSON(apps.received_data);
	    	  
	    	  if(receivedData.length > 0){
	    		  
	    		  
	    		  notificationsString = '<ul class="' + id + 'bxslider">';
	    		  
	    				    	//  alert(apps.received_data);
		    	  for (var i = 0; i < receivedData.length; i++) {	    		  
		    		  
		    		 /* notificationsString +=	'<div class="span2">';
		    		  notificationsString +=	'<div class="row text-center">';
		    		  notificationsString +=	'<img src="' + info[i].image + '">';
		    		  notificationsString +=	'</div>';
		    		  notificationsString +=	'<div class="row text-center">';
		    		  notificationsString +=		info[i].name;
		    		  notificationsString +=	'</div>';
		    		  notificationsString +=    '</div>'; */
		    		 
		    		 
		    		  
		    		  //notificationsString += '<li title="'+ receivedData[i].name +'"><img class="app-icon" src="data:image/png;base64,'+ receivedData[i].icon +'" />' + receivedData[i].name + '</li>';
		    		 notificationsString += '<li title="'+ receivedData[i].name +'"><img style="width:50px" class="app-icon" src="img/appicon.png" />' + receivedData[i].name + '</li>';
			  	  }
		    	  
		    	 
		    	  
		    	  notificationsString += '</ul>';
		    	 
		    	  $("#device-applications-" + id).html(notificationsString);
		    	  
		    	  $('.' + id + 'bxslider').bxSlider({
		    		  minSlides: 8,
		    		  maxSlides: 40,
		    		  slideWidth: 400,
		    		  slideMargin: 10
		    		});
	    		  
	    	  }
	    	  
	    	  
	      },
	      error: function(jqXHR, textStatus, errorThrown){          
	          //alert('Failed to retrieve application list');
	      } 
	});
	
}


function loadFeatures(id, devices){
	
	jQuery.ajax({
	      url: getServerURL() + "/devices/" + devices[id].id + "/features",  
	      type: "GET",
	      dataType: "json",
	      success: function(info) 
	      {
	    	 
	    	  
	    	 	    	  
	    	  notificationsString = "";
	    	  
	    	  for (var i = 0; i < info.length; i++) { 	
	    	  	
	    	  	if(info[i].feature_type != "OPERATION"){
	    			continue;
	    		}  		    	  	
	    	  	
	    	  	 	  	
	    	  	var template = null;	
	    	  	
	    	  	if(info[i].template != null){
	    	  		template = jQuery.parseJSON(info[i].template);
	    	  	}
	    	  	
	    	  	  
	    		  
	    		  notificationsString +=	'<div class="span1" style="margin-right:40px">'; 
	    		  
	    		  notificationsString +=	'<div class="row text-center">';
	    		  
								    		  if(template != null){
								    		  	notificationsString +=	'<img style="width:60px" id="operation-button" data-toggle="modal" data-target="#featureModal-'+ i +'-'+ devices[id].id +'" src="img/features/' + info[i].name + '.png">';
								    		  }else{
								    		  	notificationsString +=	'<img style="width:60px" id="operation-button-' + info[i].name + '-'+ i + '" src="img/features/' + info[i].name + '.png">';
								    		  }
	    		  
	    		  notificationsString +=	'</div>'; //end of row image
		    		  notificationsString +=	'<div class="row text-center">';
		    		  notificationsString +=		info[i].description;
		    		  notificationsString +=	'</div>'; //end of row center
	    		  notificationsString +=    '</div>'; //end of span2
	    		  
	    		  
	    		  
	    		  
	    		  //modal show
	    		  
	    		
	    		  
	    		  if(template != null){
	    		  
					  notificationsString +=    '<div id="featureModal-'+ i +'-'+ devices[id].id +'" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'+
						  							'<div class="modal-header">'+
						   									'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'+
	    				 									'<h3 id="myModalLabel">'+info[i].description+'</h3>'+					  
						  							'</div>';
						  
						  	notificationsString += 	'<div class="modal-body">';
						  	
						  			var hasButtons = false;
						  	
						  			for(var j = 0; j < template.fields.length; j++){
						  				
						  							var component = template.fields[j];						  							
						  							
						  							notificationsString += 	'<div class="row-fluid">';
						  							
						  							
						  							
						  							if(component.type == "text"){
						  								notificationsString += '<label class="text">' +	
																		 component.title + ': <input id="feature-param-' + devices[id].id + '-' + i + '-'  + j + '" type="text"> ' + 
																	'</label>';
						  							} 
						  							
						  							if(component.type == "password"){
						  								notificationsString += '<label class="password">' +	
																		 component.title + ': <input id="feature-param-' + devices[id].id + '-' + i + '-'  + j + '" type="password"> ' + 
																	'</label>';
						  							} 
						  							
						  							if(component.type == "button"){
						  								hasButtons = true;
						  								notificationsString += '<label class="text">' +	
																		'<input data-dismiss="modal" id="operation-button-' + info[i].name + '-'+ i + '" class="btn" type="button" value="'+ component.title + '"> ';
																	'</label>';
						  							}  	
						  							
						  							notificationsString += 	'</div>';	 //end of modal body													
						  			}
						  	
						  								  
					  		notificationsString +=	'</div>'; //end of modal
					  		
					  		
					  		 
					  		 if(!hasButtons){
					  		 	notificationsString +=	'<div class="modal-footer">' +														
														'<button data-dismiss="modal" id="operation-button-' + info[i].name + '-'+ i + '" class="btn btn-primary">OK</button>' +
														'<button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>' +
													'</div>';
					  		 }
					  		 
					  		
							notificationsString +=	'</div>';
							
							
							
					 		
							
	    		  }// end of if check
	    		  
	    		  
	    		 
	    			if(template == null){
	    				template = jQuery.parseJSON('{"fields":[]}');
	    			}
	    		 
	    		   $('#devices-info').on('click',  '#operation-button-' + info[i].name + '-'+ i, { operation: info[i].name, i:i, feature_type:info[i].feature_type, template:JSON.stringify(template)  }, function (e) {	    		  		
	    		  		
	    		  		   var data = {};
	    		  		   var params = {};    		  		 
	    		  		
	    		  			    		  			    		  			    		  		
	    		  		 if(e.data.template != null){ 
	    		  		 	
	    		  		 	    		  		 	
	    		  		 	var template = jQuery.parseJSON(e.data.template);	    		  		 	
	    		  		 	  		  			
	    		  			
	    		  			 
	    		  			  for (var j = 0; j < template.fields.length; j++) {
	    		  			  	
	    		  			  	 if(template.fields[j].type == "text" || template.fields[j].type == "password"){	    		  			  	 	 
	    		  			  	 	 params[template.fields[j].id] = $('#feature-param-' +devices[id].id + '-' + e.data.i + '-'  + j).val();	    		  			  	 	 
	    		  			  	 	
	    		  			  	 }
	    		  			  	 
	    		  			  	 if(template.fields[j].type == "button"){
	    		  			  	 	params["function"] = $(this).val();		    		  			  	 
	    		  			  	 	break;
	    		  			  	 }	
	    		  			  	    		  			  	 
	    		  			  }
	    		  			 
	    		  			  			 
	    		  			  
	    		  		 }
	    		  		 
	    		  		 	    		  		
	    		  		 
	    		  		 operationURL = getServerURL()  + "/devices/" + devices[id].id + "/" + e.data.operation;
	    		  		 data["data"] = params;  		  		 
	    		  		 
	    		  			    		  		  
	    		  		 
	    		  		 operationDoPost(e.data.operation, operationURL, data, devices[id].id);
	    		  		
	    		  		 
	    		  		
	    		  		 
	    		  		
	    		  		
	    		  		
	    		  	});	  	
	    		  
	    		 // notificationsString +=	'</div>';

					//notificationsString +=	'</div>';

	    		  
	    		  
	    		  
		  	  }  //end of i loop 
		  	  
	    	  $("#device-features-" + id).html(notificationsString);
	    	  
	    	  
	    	 
	    	  
	      },
	      error: function(jqXHR, textStatus, errorThrown){          
	         // alert('');
	      } 
	});
	
}


function operationDoPost(operation, operationURL, params, deviceId){
	
	//alert(operationURL + JSON.stringify(params));	
	
		
	//patch for UI TAB ISSUE
	
	
	if(device_id != deviceId){				
		return;
	}
	// end of patch for UI TAB ISSUE
	
	
	
	
	
		var answer = confirm("Are you sure you want to perform this operation?");
		if (answer){
			$.pnotify({			
					text: operation + ' Operation request sent to the device'
							  
			 });
			 
			 jQuery.ajax({
			      url: operationURL,  
			      type: "POST",
			      async: "false",
			      data: JSON.stringify(params),
			      contentType: "application/json",
			      dataType: "json"	      
		
			  });  
			  
		}
	
	
	
	 
	 
}


function bytesToSize(bytes, precision)
{  
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;
   
    if ((bytes >= 0) && (bytes < kilobyte)) {
        return bytes + ' B';
 
    } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
        return (bytes / kilobyte).toFixed(precision) + ' KB';
 
    } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
        return (bytes / megabyte).toFixed(precision) + ' MB';
 
    } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
        return (bytes / gigabyte).toFixed(precision) + ' GB';
 
    } else if (bytes >= terabyte) {
        return (bytes / terabyte).toFixed(precision) + ' TB';
 
    } else {
        return bytes + ' B';
    }
}



function checkForNullMakeBlank(val){
	if(typeof val === 'undefined'){
		return "Pending";	
	}else{
		return val;
	}  
 }

