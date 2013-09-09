chartData = null;
$(document).ready(function() {

	$( ".widget" ).each(function( index ) {
		var templateArea = $(this).attr("id");
		var templateWidget = $(this).data("chart");
		var serviceMethod = $(this).data("method");
		var title = $(this).data("title");
		
		
		
		
		$.get('../client/templates/dashboard_widgets/' + templateWidget + '.hbs').done(function(templateData) {	
			
			
			if(serviceMethod){				
				jQuery.ajax({
					url : getServiceURLs("dashboardMethods", serviceMethod),
					type : "GET",					
					contentType : "application/json",
					dataType : "json",
					success: function(data) 
				    {  			
					
						//alert(JSON.stringify(data));
						chartData = data; 
						 var template = Handlebars.compile(templateData);
						  $('#' + templateArea).html(template({index:index, title: title}));	
				    }

				});					
			}else{				
				var template = Handlebars.compile(templateData);
				$('#' + templateArea).html(template({index:index, title:title}));				
			}
			
			
					

		}).fail(function() {

		});
	});
});