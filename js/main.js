var colorgen = new RColor;//Random color generator used
var OSs;
$(document).ready(function(){
	$('#logout').click(function(e){
		$.get(route('users/unauthenicate'),function(){
			window.location = "login.jag?logout_successful=true";   
		});
	});
	if($('.dashboard').get(0)!=undefined){
		buildMainStatusChart(0);
	//	buildConnectivity();
		$('#device-widget .targets').on('click','a',function(e){
			buildDependantCharts(this);
		});
		buildDependantCharts('#device-widget .targets .active a');
		buildDependantCharts('#device-widget .targets .active a');
		$('#main-widget .widget li').hover(function(){$(this).addClass('animated bounce');}, function(){$(this).removeClass('animated bounce');});
		$('#main-widget .widget li').click(function(e){
			$('#superdiv').show();
			$('#superdiv').removeClass('animated bounce').addClass('animated bounce');
			e.preventDefault();
			OSs =$(this).attr('data-os');
			getStatusData(buildChartsStub);
			$('#main-widget .widget li').each(function(){$(this).removeClass('active')});
			$(this).addClass('active');
		});	
	}
	if($('.config').get(0)!=undefined){
		var state ='#tab1';
		$('.tabbable li a').click(function(){ state= $(this).attr('href');});
		var map={};
		$(' .username').typeahead({source:function(query, process){
			getData('users/').done(function(data){
				users =[];
				$.each(data, function(i, user){
					map[user.username]= user.id;
					users.push(user.username);
				});
				process(users);
			});
		}, updater:function(item){
			getData('users/'+map[item]).done(function(data){
				$(state+' .firstname').val(data.first_name);
				$(state+' .lastname').val(data.last_name);
				$(state+' .mobileNo').val(data.mobile_no);
				getData('users/'+map[item]+"/groups").done(function(data1){
					/*var jsos = JSON.stringify(data1);
										alert(jsos);*/
					if(data1!=null){
						$.each(data1, function(i,group){
							var groupElement = $(state+" .group label");
							groupElement.each(function(i){
								var inp= $(this).find('input');
								if(inp.data('group')==group.group_id){
									inp.attr('checked', true);
								}
							});
						});
					}
				});
			});
			return item;
		}});
		loadGroups();
		$(".group-config").on('click', '.delete-group', function(){
			var groupid= $(this).data('group');
			$.ajax({
				type:"DELETE", 
				url: route('groups/'+groupid)}).done(function(){loadGroups()});
		});
		$('.group-config .savegroup').click(function(){
			var groupName= $('.groupname').val();
			$.ajax({
				type:"POST", 
				url: route('groups'), 
				data:JSON.stringify({name:groupName})}).done(function(){
					loadGroups();
					$('.groupname').val('');
				});
		});
		//Button actions for both panels
		$('.saveuser').click(function(){
			userid =map[$(state+' .username').val()];
			//alert(userid);
			if(state=='#tab1' && userid==undefined){
				//alert('Can insert user');
				firstname= $(state+' .firstname').val();
				lastname= $(state+' .lastname').val();
				username = $(state+' .username').val();
				password =$(state+' .password').val();
				mobileNo =$(state+' .mobileNo').val();
				jso ={"tenant_id" : 1, "username" : username, "password" : password, "first_name" : firstname, "last_name" : lastname, "mobile_no" : mobileNo, "created_date" : "2013/2/11",  "usercategory_id" : 2};
				postData('users/', JSON.stringify(jso)).done(function(){
					var groupsArray= Array();
					$(state+" .group input:checked").each(function(i){
						groupsArray.push($(this).data('group'));
					});
					//TODO - Do this without another api call
					getData('users/').done(function(data){
						users =[];
						$.each(data, function(i, user){
							if(user.username==$(state+' .username').val()){
								$.ajax({
										type:"PUT", 
										url: route('users/'+user.id+'/groups'), 
										data:JSON.stringify({groups:groupsArray})});
							}
						});
					});
					alert("User created successfully");
				});
			}if(state=='#tab2' && userid==undefined){
					alert("User does not exist");
			}if(state=='#tab1' && userid!=undefined){
					alert('User already exists');
			}if(state=='#tab2' && userid!=undefined){
					//alert('Can change user');
					var groupsArray= Array();
					$(state+" .group input:checked").each(function(i){
						groupsArray.push($(this).data('group'));
					});
					$.ajax({
						type:"PUT", 
						url: route('users/'+map[$(state+' .username').val()]+'/groups'), 
						data:JSON.stringify({groups:groupsArray})}).done("Successfully added to Database");;
			}
		});
		$('.sendemail').click(function(){
			getData('users/'+map[$(state+' .username').val()]+"/sendmail", function(){
				alert('Email has been sent');
			});
			
		});
	}
	//var jsos = JSON.stringify(data);
	//alert(jsos);
	//var js = JSON.parse(jsos);
	//alert(js);
	//createArea("chartVendor", data);
});
function loadGroups(){
	getData('groups/').done(function(data){
		var groupElement = $(".group");
		var tableElement = $(".group-config table tbody");
		groupElement.empty();
		tableElement.empty();
		$.each(data,function(i,group){
			groupElement.append('<label class="checkbox"><input type="checkbox" data-group="'+group.id+'">'+group.name+'</label>');
			tableElement.append('<tr><td>'+group.name+'</td><td><a href="#delete" class="delete-group" data-group="'+group.id+'"><i class="icon-remove"></i></a></td></tr>');
		});
	});
}

function buildChartsStub(data){
		var OSSpecific = data[OSs];
		prepareStatusDOM(OSSpecific, OSs);
		buildDependantCharts('#device-widget .targets a');
		colorRiseMainLabel();
}

function buildDependantChartsStub(data){
	var OS = $('#main-widget .widget .active').attr('data-os');
	var chartName = $(tg).attr('href').substr(1);
	//alert(OS);	
	var jsos = JSON.stringify(data);
	//alert(jsos);
	var data = data[OS].data;
	var chartID = chartName.substr(5);
	data = data[chartID];
	var values =[];
	for (var key in data){
		if(data.hasOwnProperty(key)){
			values.push({
				value: data[key][0],
				total:data[key][1],
				color: colorgen.get(true,1.0,0.8),
				data : key
			});
		}
	}
	createArea(chartName, values);
}
var tg;
function buildDependantCharts(target){
	tg=target;
	getStatusData(buildDependantChartsStub);
	
}

function buildConnectivity(){
	if(document.getElementById('gauge')!=undefined){
		var data;//= getData('dashboard/connectivity')
		data = {'online': 65, 'onlineNo': 1400, 'offlineNo':500};
		var g = new JustGage({
			id: "gauge", 
			value: data['online'], 
			min: 0,
			max: 100,
			title: ' '
	  	});
		$('#device-gage .online').html(data['onlineNo']);
		$('#device-gage .offline').html(data['offlineNo']);
	}
}
function buildMainStatusChartStub(data){
	//TODO: select the first item from the json
	var values =[];
	for (var key in data){
		if(data.hasOwnProperty(key)){
			values.push({
				value: data[key].percentage[0],
				total: data[key].percentage[1],
				color: colorgen.get(true,1.0,0.8)
			});
		}
	}
	var OSSpecific = data['iOS'];
	prepareStatusDOM(OSSpecific, 'iOS');
	createMainArea(document.getElementById("chartOS"), values);
}
/*
* Builds the main status chart and 
*/
function buildMainStatusChart(select){
	if(select!=undefined && select !=null){
		getStatusData(buildMainStatusChartStub);
	}
}

function prepareStatusDOM(data, os){
	data = data.data;
	var jsos = JSON.stringify(data);
	//alert(jsos);
	var ulList =$('.nav.nav-tabs.targets');
	ulList.empty();
	var tabsContainer = $('#sub-widget');
	tabsContainer.empty();
	var flag = true;
	for (var key in data){
		if(data.hasOwnProperty(key)){
			
			var createHTML='<li ><a href="#chart'+key+'" data-os="'+os+'" data-toggle="tab">'+key+'</a></li>';
			if(flag){
				createHTML = '<li class="active"><a href="#chart'+key+'" data-os="'+os+'" data-toggle="tab">'+key+'</a></li>';
				flag=false;
			}
			tabsContainer.append('<div id="chart'+key+'" class="tab-pane active widget"><div><canvas width="200" height="200"></canvas></div><ul></ul></div>');
			ulList.append(createHTML);
		}
	}
}
// Get the status information chart data from the backend and cache it. Also expire the cache with an interval
// TODO: Properly setup HTML5 cacheing for this
var dataMain;
function getStatusData(func){
 		getData('cont/dashboard.jag').done(func);
		/*dataMain = { "iOS" : {"percentage": 30,"data":{
										    "Version": {"5.1" :30, "6.1" : 70},
											"Type" : {"iPhone": 40, "iPad" : 60},
											"BYOD" : {"BYOD" : 70, "NON-BYOD" : 30},
											"Connectivity" : {"Online" :40 , "Offline" : 60}
										}},
										"Windows" :{"percentage": 10, "data":{
										    "Version": {"7" :30, "8" : 70},
											"Vendor" : {"HTC": 20, "Nokia" : 80},
											"BYOD" : {"BYOD" : 70, "NON-BYOD" : 30},
											"Connectivity" : {"Online" :50 , "Offline" : 50}
										}},	
										"Android" :{"percentage": 60,"data":{
											    "Version": {"2.3" :30, "4.0" : 70},
												"Vendor" : {"Samsung": 70, "HTC" : 10, "LG":20},
												"BYOD" : {"BYOD" : 30, "NON-BYOD" : 70},
												"Connectivity" : {"Online" :20 , "Offline" : 80}
										}}
									};	
						func(dataMain);*/
		
//	setInterval(getStatusData(true),60000);
}
/*
* Send the url 
*/
function getData(element){
	return $.getJSON(route(element));
}

function postData(url, data){
	return $.post(route(url), data);
}
/*
* This method will add in the context for routing endpoints
*/
function route(url){
	url ='/mdm/'+url;
	return url;
}

/*
*	Build a chart with data and current chart object
*/
function  buildChart(chart_element, data){
	if(chart_element!=undefined){
		var ctx= chart_element.getContext("2d");
		var chartOS = new Chart(ctx).Pie(data);
	}
}

function colorRiseMainLabel(){
	$('#main-widget .widget li').css({'background-color':'white'});
	$('#device-widget .widget .active').css({'background-color':$('#main-widget .widget .active .label').css('backgroundColor')});
}
/*
* Update the background colors for the OS labels
*/

function createMainArea(chart_element, data){
	var jsos = JSON.stringify(data);
	$('#superdiv .totalcount').html("Total Devices-"+data[0]['total']);
	//alert(jsos);
	data[1]['color']= '#DCDCDC';
	data[0]['color']= '#A4C739';
	data[2]['color']= '#26A3D9';
	$('.valApple').prepend(data[1]['value'].toFixed(2)).css({'background-color':data[1]['color']});
	$('.valAndroid').prepend(data[0]['value'].toFixed(2)).css({'background-color':data[0]['color']});
	$('.valWindows').prepend(data[2]['value'].toFixed(2)).css({'background-color':data[2]['color']});
	colorRiseMainLabel();
	buildChart(document.getElementById("chartOS"), data);
}
/*
*	Create sub-widgets and build the data indexes
*/
function createArea(chart_name, data){
	var chartElement = $("#"+chart_name+" canvas").get(0);
	var list =  $("#"+chart_name+" ul");
	list.empty();
	for(var i=0, item; item=data[i]; i++){
		list.append('<li><span style="background-color:'+item['color']+'" class="label">'+item['data']+'</span><span class="valWindows"> - '+item['value'].toFixed(2)+'%</span>   Total : '+item['total']+'</li>');	
	}
	buildChart(chartElement, data);
}