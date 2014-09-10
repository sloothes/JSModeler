ImporterApp = function ()
{
	this.viewer = null;
	this.files = null;
	this.meshVisibility = null;
};

ImporterApp.prototype.Init = function ()
{
	window.onresize = this.Resize.bind (this);
	this.Resize ();

	this.viewer = new ImporterViewer ();
	this.viewer.Init ('example');

	window.addEventListener ('dragover', this.DragOver.bind (this), false);
	window.addEventListener ('drop', this.Drop.bind (this), false);
	
	// debug
	var myThis = this;
	JSM.GetArrayBufferFromURL ('cube.3ds', function (arrayBuffer) {
		myThis.viewer.LoadArrayBuffer (arrayBuffer);
		myThis.JsonLoaded ();
	});
};

ImporterApp.prototype.Resize = function ()
{
	var left = document.getElementById ('left');
	var canvas = document.getElementById ('example');
	canvas.width = document.body.clientWidth - left.clientWidth - 1;
	canvas.height = document.body.clientHeight;
};

ImporterApp.prototype.JsonLoaded = function ()
{
	var jsonData = this.viewer.GetJsonData ();

	this.meshVisibility = {};
	var i;
	for (i = 0; i < jsonData.meshes.length; i++) {
		this.meshVisibility[i] = true;
	}

	this.GenerateMenu (jsonData, this);
	this.Generate (true);
};

ImporterApp.prototype.GenerateMenu = function ()
{
	function AddMaterial (importerMenu, material)
	{
		importerMenu.AddSubGroup (materialsGroup, material.name, {
			button : {
				visible : false,
				open : 'images/info.png',
				close : 'images/info.png',
				onOpen : function (content, material) {
					var table = new InfoTable (content);
					table.AddColorRow ('Ambient', material.ambient);
					table.AddColorRow ('Diffuse', material.diffuse);
					table.AddColorRow ('Specular', material.specular);
					table.AddRow ('Opacity', material.opacity.toFixed (2));
				},
				title : 'Show/Hide Information',
				userData : material
			}
		});
	}

	function AddMesh (importerApp, importerMenu, mesh, meshIndex)
	{
		importerMenu.AddSubGroup (meshesGroup, mesh.name, {
			button : {
				visible : false,
				open : 'images/info.png',
				close : 'images/info.png',
				onOpen : function (content, mesh) {
					function GetVisibleName (name)
					{
						if (name == 'vertexCount') {
							return 'Vertex count';
						} else if (name == 'triangleCount') {
							return 'Triangle count';
						}
						return name;
					}

					var table = new InfoTable (content);
					var i, additionalInfo;
					for (i = 0; i < mesh.additionalInfo.length; i++) {
						additionalInfo = mesh.additionalInfo[i];
						table.AddRow (GetVisibleName (additionalInfo.name), additionalInfo.value);
					}
				},
				title : 'Show/Hide Information',
				userData : mesh
			},
			userButton : {
				visible : true,
				onCreate : function (image) {
					image.src = 'images/visible.png';
				},
				onClick : function (image, meshIndex) {
					importerApp.meshVisibility[meshIndex] = !importerApp.meshVisibility[meshIndex];
					image.src = importerApp.meshVisibility[meshIndex] ? 'images/visible.png' : 'images/hidden.png';
					importerApp.Generate (false);
				},
				title : 'Show/Hide Mesh',
				userData : meshIndex
			}
		});
	}
	
	var jsonData = this.viewer.GetJsonData ();
	var menu = document.getElementById ('menu');
	while (menu.lastChild) {
		menu.removeChild (menu.lastChild);
	}

	var importerMenu = new ImporterMenu (menu);
	var materialsGroup = importerMenu.AddGroup ('Materials', {
		button : {
			visible : true,
			open : 'images/opened.png',
			close : 'images/closed.png',
			title : 'Show/Hide Materials'
		}
	});

	var i, material;
	for (i = 0; i < jsonData.materials.length; i++) {
		material = jsonData.materials[i];
		AddMaterial (importerMenu, material);
	}
	
	var meshesGroup = importerMenu.AddGroup ('Meshes', {
		button : {
			visible : true,
			open : 'images/opened.png',
			close : 'images/closed.png',
			title : 'Show/Hide Meshes'			
		}
	});
	
	var mesh;
	for (i = 0; i < jsonData.meshes.length; i++) {
		mesh = jsonData.meshes[i];
		AddMesh (this, importerMenu, mesh, i);
	}
};

ImporterApp.prototype.Generate = function (withFitInWindow)
{
	if (!this.viewer.LoadJsonData (this.meshVisibility)) {
		return;
	}

	if (withFitInWindow) {
		this.viewer.FitInWindow ();
	}
};

ImporterApp.prototype.DragOver = function (event)
{
	event.stopPropagation ();
	event.preventDefault ();
	event.dataTransfer.dropEffect = 'copy';
};
		
ImporterApp.prototype.Drop = function (event)
{
	event.stopPropagation ();
	event.preventDefault ();
	
	this.files = event.dataTransfer.files;
	if (this.files.length === 0) {
		return;
	}
	
	var mainFile = null;
	var i, file, fileName, firstPoint, extension;
	for (i = 0; i < this.files.length; i++) {
		file = this.files[i];
		fileName = file.name;
		firstPoint = fileName.lastIndexOf ('.');
		if (firstPoint == -1) {
			continue;
		}
		extension = fileName.substr (firstPoint);
		extension = extension.toUpperCase ();
		if (extension == '.3DS') {
			mainFile = file;
			break;
		}
	}
	
	if (mainFile === null) {
		return;
	}
	
	var myThis = this;
	JSM.GetArrayBufferFromFile (mainFile, function (arrayBuffer) {
		myThis.viewer.LoadArrayBuffer (arrayBuffer);
		myThis.JsonLoaded ();
	});
};

window.onload = function ()
{
	var importerApp = new ImporterApp ();
	importerApp.Init ();
};