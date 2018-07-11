const sheetSettingsKey = 'ImageViewer';
var viewer;
var sheet;
var mode = "select";
var sheetIndex = 0;
var urlIndex = 0;
var multiImages = true;
var toolbar = true;
var toolbarOpt = true;
var navbar = true;
var navbarOpt = true;
var toolbarColour = "rgba(0, 0, 0, .5)"
var navbarColour = "rgba(0, 0, 0, .5)";
var rotateImage = 0;

$(document).ready(function () {
  tableau.extensions.initializeAsync({'configure': configure}).then(function() {

    tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
      console.log("settings changed")
      setConfig(function(validConfig) {
        if (validConfig) {
          initializeViewer(true);
        }
      });
    });
    setConfig(function(validConfig) {
      if (validConfig) {
        initializeViewer(true);
      } else {
        configure();
      }

    });
  });

});

var setConfig = function (callback) {
  var validConfig = false;
  if(tableau.extensions.settings.get(sheetSettingsKey)) {
    var settings = JSON.parse(tableau.extensions.settings.get(sheetSettingsKey));
    mode = settings.mode;
    sheetIndex = settings.sheetIndex;
    urlIndex = settings.urlIndex;
    toolbarOpt = settings.toolbarOpt;
    navbarOpt = settings.navbarOpt;
    toolbarColour = settings.toolbarColour;
    navbarColour = settings.navbarColour;
    rotateImage = settings.rotateImage;
    if (settings.mode && settings.sheetIndex && settings.urlIndex) {
      validConfig = true;
    }
  }
  callback(validConfig);
}

var initializeViewer = function (refresh) {
  sheet = tableau.extensions.dashboardContent.dashboard.worksheets[sheetIndex];
  sheet._eventListenerManagers["mark-selection-changed"]._handlers = [];
  sheet._eventListenerManagers["filter-changed"]._handlers = [];
  if (mode == "select") {
    // sheet.removeEventListener(tableau.TableauEventType.FilterChanged,function(ev) {
    //   console.log("Removed Filter Changed Listener", ev);
    // });
    sheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged,getSelectedMarkData);
    if (refresh) {
      getSelectedMarkData();
    }
  } else if (mode == "filter") {
    // sheet.removeEventListener(tableau.TableauEventType.MarkSelectionChanged,function(ev) {
    //   console.log("Removed Mark Selection Listener", ev);
    // });
    sheet.addEventListener(tableau.TableauEventType.FilterChanged,getSummaryData);
    if (refresh) {
      getSummaryData();
    }
  }

}

var getSelectedMarkData = function () {
  console.log("getSelectedMarkData");
  sheet.getSelectedMarksAsync().then((data) => {
    if (data) {
      showImages(data.data[0].data);
    }
  });
}

var getSummaryData = function() {
  console.log("getSummaryData");
  sheet.getSummaryDataAsync().then((data) => {
    if (data) {
      showImages(data.data);
    }
  });
}

var showImages = function(dataset) {
  console.log(dataset);
  if (viewer) {
    viewer.destroy();
  }
  $('#images').html('');
  if (dataset.length > 0) {
    if (multiImages && dataset.length > 1) {
      for (var i = 0; i < dataset.length; i++) {
        $('#images').append('<li><img src="'+dataset[i][urlIndex].value+'"></li>');
      }
      if (navbarOpt) {
        navbar = true;
      } else {
        navbar = false;
      }
      if (toolbarOpt) {
        toolbar = true;
      } else {
        toolbar = false;
      }
    } else if (dataset.length == 1) {
      navbar = false;
      if (toolbarOpt) {
        toolbar = true;
      } else {
        toolbar = false;
      }
      $('#images').append('<li><img src="'+dataset[0][urlIndex].value+'"></li>');
    }
  }
  var images = document.getElementById('images');
  viewer = new Viewer(images, {
    inline: true,
    backdrop: false,
    scalable: false,
    tooltip: false,
    movable: false,
    navbar: navbar,
    toolbar: toolbar,
    title: false,
    ready: function() {
      viewer.full();
      $('.viewer-toolbar li').css('background-color',toolbarColour);
      $('.viewer-navbar').css('background-color',navbarColour);
    },
    viewed: function() {
      viewer.rotate(rotateImage);
    }
  });
}

function configure() {
  const popupUrl = `${window.location.origin}/configure.html`;
  tableau.extensions.ui.displayDialogAsync(popupUrl, 'Payload Message', { height: 550, width: 500 }).then((closePayload) => {

  }).catch((error) => {
    switch(error.errorCode) {
      case tableau.ErrorCodes.DialogClosedByUser:
        console.log("Dialog was closed by user");
        break;
      default:
        console.error(error.message);
    }
  });
}
