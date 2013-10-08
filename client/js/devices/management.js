$(document).ready(function() {

	oTable = $('#main-table').dataTable({
		"sDom" : "<'row-fluid'<'tabel-filter-group span8'T><'span4'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
		"bProcessing" : true,
		"bServerSide" : true,
		"sAjaxSource" : "/mdm/config/test/dummy_devices.json"
	});
	
	
	
	$(".tabel-filter-group").html("Role: " + fnCreateSelect( oTable.fnGetColumnData(4)));
	
	$('.tabel-filter-group select').change( function () {
            oTable.fnFilter( $(this).val(), 4 );
    } );
    
   
    $(".tabel-filter-group").append(" User: " + fnCreateSelect( oTable.fnGetColumnData(4)));
	
	$('.tabel-filter-group select').change( function () {
            oTable.fnFilter( $(this).val(), 4 );
    } );
    
    
    $(".tabel-filter-group").append("<br> Type: " + fnCreateSelect( oTable.fnGetColumnData(4)));
	
	$('.tabel-filter-group select').change( function () {
            oTable.fnFilter( $(this).val(), 4 );
    } );
    
     $(".tabel-filter-group").append(" OS: " + fnCreateSelect( oTable.fnGetColumnData(4)));
	
	$('.tabel-filter-group select').change( function () {
            oTable.fnFilter( $(this).val(), 4 );
    } );
	

});

function fnCreateSelect(aData) {
	var r = '<select><option value="">--All--</option>', i, iLen = aData.length;
	for ( i = 0; i < iLen; i++) {
		r += '<option value="' + aData[i] + '">' + aData[i] + '</option>';
	}
	return r + '</select>';
}