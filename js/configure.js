const sheetSettingsKey = 'ImageViewer';

var func = {};

func.saveSettings = function(meta, callback) {
  tableau.extensions.settings.set(sheetSettingsKey, JSON.stringify(meta));
  tableau.extensions.settings.saveAsync().then((newSavedSettings) => {
    callback(newSavedSettings);
  });
}

func.getSettings = function(callback) {
  if (tableau.extensions.settings.get(sheetSettingsKey)) {
    var settings = JSON.parse(tableau.extensions.settings.get(sheetSettingsKey));
    callback(settings);
  } else {
    callback({});
  }
}

func.currentConfig = function(callback) {
  var config = {};
  config.seenConfig = true;
  config.mode = $('#modeSelect').val();
  config.sheetIndex = parseInt($('#sourceSheetSelect').val());
  config.urlIndex = parseInt($('#sourceUrlSelect').val());
  config.toolbarOpt = document.getElementById('toolbarOpt').checked;
  config.navbarOpt = document.getElementById('navbarOpt').checked;
  config.toolbarColour = $('#toolbarColour').val();
  config.navbarColour = $('#navbarColour').val();
  config.rotateImage = parseInt($('#rotateImageSelect').val());
  if (config.toolbarOpt) {
    $('#toolbarColourField').show();
  } else {
    $('#toolbarColourField').hide();
  }
  if (config.navbarOpt) {
    $('#navbarColourField').show();
  } else {
    $('#navbarColourField').hide();
  }
  callback(config);
}

func.initialize = function(callback) {
  // var settings = JSON.parse(tableau.extensions.settings.get(sheetSettingsKey));
  // console.log("Current Config", settings)
  // func.currentConfig(function(config) {
  //   func.saveSettings(config, function(settings) {
  //
  //   })
  // });
  const urlSelect = new mdc.select.MDCSelect(document.querySelector('#sourceUrl'));
  const modeSelect = new mdc.select.MDCSelect(document.querySelector('#mode'));
  modeSelect.listen('change', () => {
    func.currentConfig(function(config) {
      func.saveSettings(config, function(settings) {

      })
    });
  });
  var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  for (var i = 0; i < worksheets.length; i++) {
    var ws = worksheets[i];
    $('#sourceSheetSelect').append(`<option value="`+i+`">`+ws.name+`</option>`);
  }
  const sheetSelect = new mdc.select.MDCSelect(document.querySelector('#sourceSheet'));
  sheetSelect.listen('change', () => {
    func.currentConfig(function(config) {
      func.saveSettings(config, function(settings) {
        buildDimensionSelect(function() {

        });
      })
    });
  });
  const rotateSelect = new mdc.select.MDCSelect(document.querySelector('#rotateImage'));
  rotateSelect.listen('change', () => {
    func.currentConfig(function(config) {
      func.saveSettings(config, function(settings) {

      })
    });
  });
  callback();
}

var buildDimensionSelect = function(callback) {
  func.currentConfig(function(config) {
    var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
    var sheet = worksheets[config.sheetIndex];
    sheet.getSummaryDataAsync({ignoreSelection: true}).then((data) => {
      $('#sourceUrlSelect').html('<option value="" disabled selected></option>');
      var cols = data.columns;
      var valid = false;
      for (var i = 0; i < cols.length; i++) {
        if (cols[i].dataType == "string") {
            $('#sourceUrlSelect').append(`<option value="`+i+`">`+cols[i].fieldName+`</option>`);
            valid = true;
        }
      }
      if (valid) {
        document.querySelector('#sourceUrl').MDCSelect.disabled = false;
        $('#sourceUrlSelect').removeAttr("disabled");
      } else {
        document.querySelector('#sourceUrl').MDCSelect.disabled = true;
        $('#sourceUrlSelect').attr("disabled", true);
      }
      const urlSelect = new mdc.select.MDCSelect(document.querySelector('#sourceUrl'));
      urlSelect.listen('change', () => {
        func.currentConfig(function(config) {
          func.saveSettings(config, function(settings) {
            if (data.data[0][$('#sourceUrlSelect').val()].value) {
              $('#urlPreview').html(data.data[0][$('#sourceUrlSelect').val()].value);
            }
          })
        });
      });
      callback(data);
    });
  });
}

var configureUI = function() {
  func.getSettings(function(settings) {
    if (settings.mode) {
      $('#modeSelect').val(settings.mode);
      $('#modeSelect').parent().find('label').addClass('mdc-floating-label--float-above');
    }
    if (settings.toolbarOpt) {
      $('#toolbarOpt').attr('checked', true);
      $('#toolbarColourField').show();
    } else {
      $('#toolbarOpt').attr('checked', false);
      $('#toolbarColourField').hide();
    }
    if (settings.navbarOpt) {
      $('#navbarOpt').attr('checked', true);
      $('#navbarColourField').show();
    } else {
      $('#navbarOpt').attr('checked', false);
      $('#navbarColourField').hide();
    }
    if (settings.rotateImage) {
      $('#rotateImageSelect').val(settings.rotateImage);
    } else {
      $('#rotateImageSelect').val(0);
    }
    if (settings.toolbarColour) {
      $('#toolbarColour').val(settings.toolbarColour);
      $('.mdc-text-field__icon.toolbar-colour').css('color',settings.toolbarColour);
    }
    if (settings.navbarColour) {
      $('#navbarColour').val(settings.navbarColour);
      $('.mdc-text-field__icon.navbar-colour').css('color',settings.navbarColour);
    }
    console.log(settings.sheetIndex)
    if (settings.sheetIndex >= 0) {
      $('#sourceSheetSelect').val(settings.sheetIndex);
      $('#sourceSheetSelect').parent().find('label').addClass('mdc-floating-label--float-above');
      buildDimensionSelect(function(data) {
        if (settings.urlIndex >= 0) {
          document.querySelector('#sourceUrl').MDCSelect.disabled = false;
          $('#sourceUrlSelect').removeAttr("disabled");
          $('#sourceUrlSelect').val(settings.urlIndex);
          $('#sourceUrlSelect').parent().find('label').addClass('mdc-floating-label--float-above');
          if (data.data[0][$('#sourceUrlSelect').val()].value) {
            $('#urlPreview').html(data.data[0][$('#sourceUrlSelect').val()].value);
          }
        }
      });
    }
  });
}

$(document).ready(function () {
  tableau.extensions.initializeDialogAsync().then(function (openPayload) {

    $('.resetBtn').click(resetSettings);

    $('.mdc-tab').click(function() {
      $('.mdc-tab').removeClass('mdc-tab--active');
      $(this).addClass('mdc-tab--active');
      $('.mdc-card').hide();
      $('.'+$(this).attr('id')+'-card').show();
      //mdc.textField.MDCTextField.attachTo(document.querySelector('.mdc-text-field'));
    });
    func.initialize(function() {
      window.mdc.autoInit();
      configureUI();
    });

    $('#toolbarOpt').click(function() {
      func.currentConfig(function(config) {
        func.saveSettings(config, function(settings) {
          console.log("Toolbar option set");
        });
      });
    });
    $('#navbarOpt').click(function() {
      func.currentConfig(function(config) {
        func.saveSettings(config, function(settings) {
          console.log("Navbar option set");
        });
      });
    });
  });
  const navbarColourField = new mdc.textField.MDCTextField(document.querySelector('#navbarColourField'));
  $('.navbar-colour').materialColorPicker({
    mode: "modal",
  	format: "rgba", // Format that allows transparency
  	opacity: true, // Set to "true" to parse transparency
  	onSelect: function(e){
  		if (e.currentcolor){
  			var color = e.currentcolor.color;
  			$('#navbarColour').val(color);
        $('.mdc-text-field__icon.navbar-colour').css('color',color);
        func.currentConfig(function(config) {
          func.saveSettings(config, function(settings) {
            console.log("Navbar colour set");
          });
        });
  		}
  	}
  });
  const toolbarColourField = new mdc.textField.MDCTextField(document.querySelector('#toolbarColourField'));
  $('.toolbar-colour').materialColorPicker({
    mode: "modal",
  	format: "rgba", // Format that allows transparency
  	opacity: true, // Set to "true" to parse transparency
  	onSelect: function(e){
  		if (e.currentcolor){
  			var color = e.currentcolor.color;
  			$('#toolbarColour').val(color);
        $('.mdc-text-field__icon.toolbar-colour').css('color',color);
        func.currentConfig(function(config) {
          func.saveSettings(config, function(settings) {
            console.log("Toolbar colour set");
          });
        });
  		}
  	}
  });
  $('#toolbarColour').on('keyup', function() {
    $('.mdc-text-field__icon.toolbar-colour').css('color',$('#navbarColour').val());
    func.currentConfig(function(config) {
      func.saveSettings(config, function(settings) {
        console.log("Toolbar colour set");
      });
    });
  });
  $('#navbarColour').on('keyup', function() {
    $('.mdc-text-field__icon.navbar-colour').css('color',$('#navbarColour').val());
    func.currentConfig(function(config) {
      func.saveSettings(config, function(settings) {
        console.log("Navbar colour set");
      });
    });
  });
});

function resetSettings() {
  var config = {};
  config.seenConfig = true;
  config.mode = "select";
  config.sheetIndex = 0;
  config.urlIndex = 0;
  config.toolbarOpt = true;
  config.navbarOpt = true;
  config.toolbarColour = "rgba(0, 0, 0, .5)";
  config.navbarColour = "rgba(0, 0, 0, .5)";
  config.rotateImage = 0;
  func.saveSettings(config, function(settings) {
    console.log("Settings Reset");
    configureUI();
  });
}
