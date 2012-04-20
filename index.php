<!DOCTYPE html>
<html>
	<head>
		<title>Test Page</title>
	  <link rel="stylesheet" href="jquery.peGrid.css" type="text/css" media="screen" charset="utf-8">
	  <script src="jquery.js" type="text/javascript" charset="utf-8"></script>
		<script src="jquery.ui.js" type="text/javascript" charset="utf-8"></script>
	  <script src="jquery.peGrid.js" type="text/javascript" charset="utf-8"></script>
		<!-- CHOSEN -->
		<link rel="stylesheet" href="http://localhost/~eze/Chosen/chosen.css" type="text/css" media="screen" charset="utf-8">
	  <script src="http://localhost/~eze/Chosen/chosen.jquery.min.js	" type="text/javascript" charset="utf-8"></script>
		
	</head>
	<?php
	$options = array();
	for ($i=0; $i < 100; $i++) { 
		$options[$i]=$i.$i.$i;
	}
	?>
	<body>
	<table id="TablaConceptosAFacturar" border="0" cellspacing="0" cellpadding="0"
	    width="100%" class="sTable2 peGrid">
	      <thead>
	        <tr>
	          <th>Fecha</th>
	          <th>Concepto</th>
	          <th>Numero de Cheque</th>
	          <th>Importe</th>
	          <th>ID</th>
	          <th>OperacionID</th>
	        </tr>
	      </thead>
				<tbody>
					<tr>
						<td>
							<select name="data[Model][0][field]">
							<?php for ($i=0; $i < sizeof($options); $i++) { 
								echo "<option value='$i'>{$options[$i]}</option>";
							} ?>
						</select>
						</td>
						<td></td>
						<td></td>
						<td></td>
						<td></td>
						<td></td>
					</tr>
				</tbody>
	    </table>
			<script type="text/javascript" charset="utf-8">
				var ref;
				$("table").peGrid();// .bind("editorReady",function(){
				// 					console.log("editor ready");
				// 					
				// 				});
				$("#target").click(function(){
					ref.focus()
				});
				ref = $("select").chosen();
				
			</script>
	</body>
</html>
