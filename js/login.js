$('#form-signin').submit(function(event) {
	
	event.preventDefault();
	
	username = $("#txtUsername").val();
	password = $("#txtPassword").val();
	
	
	

	// url: "http://10.200.3.43:9764/MDMAgent1.1/con/users.jag?callback=?",
	//  url: "http://localhost:9763/mdm/www/MDMAgent1.1/_con/users.jag",
	
	//sends a post request to login
	// var request = $.ajax({       
	//         url: "/mdm/users/authenticate",
	//         type: "POST",        
	//         data: JSON.stringify()        
	//     }); 
	
	var request = $.ajax({
		type:"POST", 
		url: "/mdm/users/authenticate", 
		data: JSON.stringify({username: username, password: password})});

    // callback handler that will be called on success
	request.success(function (response,status,xjq){ 
		var usertype = response.split('|')[1];
		var userid = response.split('|')[2];
		localStorage.username = username;
		if(usertype==1){
			//tenant
			window.location = "index.jag"; 
		}else if(usertype==2){
			//user
			window.location = "users_devices.jag?user="+userid; 
		}   	
    });

    // callback handler that will be called on failure
    request.fail(function (jqXHR, textStatus, errorThrown){      	
    //	window.location = "?login_failed=true";    	
    });
});