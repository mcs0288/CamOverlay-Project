const fs = require('fs');
const CamOverlayAPI = require('camstreamerlib/CamOverlayAPI');
const request = require('request');
const https = require('https');
const path = 'img.png';

//these are variables that are harded coded in for deminstration and testing purposes
//assuming that these variables will be passes in from other functions or files
var camera_ip = '212.24.145.122';
var camera_port = 780;
var camera_username = 'root';
var camera_pass = 'af895d6s';
var hcti_user = "851d10e2-3902-4f1d-a649-c7fb42880601";
var hcti_pass = "c61c9262-31be-461c-9a6d-63840dd1b9f2";
var html_webpage_url = 'https://camstreamer.com';


//calling the main function with the temparary values above
main(html_webpage_url, camera_ip, camera_port, camera_username, camera_pass, hcti_user, hcti_pass);

//main function
function main(html_webpage_url, camera_ip, camera_port, camera_username, camera_pass, hcti_user, hcti_pass){
  htmlToUrl(html_webpage_url, camera_ip, camera_port, camera_username, camera_pass, hcti_user, hcti_pass);
  
}

// html to http coversion.
function htmlToUrl(html_webpage_url, camera_ip, camera_port, camera_username, camera_pass, hcti_user, hcti_pass){
  const data = {
    url: html_webpage_url
  }

  request.post({ url: 'https://hcti.io/v1/image', form: data})
  .auth(hcti_user, hcti_pass)
  .on('data', function(data) {
    const obj = JSON.parse(data);
    if (obj.error) {
      console.log("hcti.io error: " + obj.error);
      return;
    }
    var url = obj.url;
    urlToImage(url, camera_ip, camera_port, camera_username, camera_pass);
  });
}

//download .jpg file
function urlToImage(url, camera_ip, camera_port, camera_username, camera_pass){
  https.get(url,(res) => { 
    const filePath = fs.createWriteStream(path);
    res.pipe(filePath);
    filePath.on('finish',() => {
      filePath.close();
      createOverlay(camera_ip, camera_port, camera_username, camera_pass);
    })
  })
}

//Overlay
function createOverlay(camera_ip, camera_port, camera_username, camera_pass) {
  var co = new CamOverlayAPI({
    'ip': camera_ip,
    'port': camera_port,
    'auth': camera_username+':'+camera_pass,
    'serviceName': 'Drawing Test',
    'serviceID': -1,
    'camera': 0
  });

  co.connect().then(function() {
    co.cairo('cairo_image_surface_create', 'CAIRO_FORMAT_ARGB32', 750, 750).then(function(surfaceRes) {
      var surface = surfaceRes.var;

      co.cairo('cairo_create', surface).then(function(cairoRes) {
        var cairo = cairoRes.var;

        var imgData = fs.readFileSync(path);
        co.uploadImageData(imgData).then(function(imgSurfaceRes) {
          var imgSurface = imgSurfaceRes.var;

          co.cairo('cairo_translate', cairo, 10, 100);
          co.cairo('cairo_scale', cairo, 0.5, 0.5);
          co.cairo('cairo_set_source_surface', cairo, imgSurface, 0, 0);
          co.cairo('cairo_paint', cairo);
          co.cairo('cairo_surface_destroy', imgSurface);

          co.showCairoImage(surface, -1.0, -1.0).then(function() {
            console.log('success');
            process.exit(0);
          }, 
          
          function() {
            console.log('uploadImageData error');
            process.exit(1);
          }); 
        });
      });
    });
  }, 
  function(err) {
    if (err)
      console.log(err)
  });
};
