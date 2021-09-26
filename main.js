const fs = require('fs');
const CamOverlayAPI = require('camstreamerlib/CamOverlayAPI');
const request = require('request');
const https = require('https');

// html and css code.
const data = {
  html: '<img src="https://media.istockphoto.com/vectors/security-camera-line-icon-minimalist-icon-isolated-on-white-cctv-vector-id1158056356?k=20&m=1158056356&s=612x612&w=0&h=Rb94N0v3-T5_PuFmg6WcSnd8Zsz6iA87_iO0q46WrTc=" class="rounded-circle shadow border" width="100px"><link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">',
  css: '.tweet-text {background-color: transparent;background-image: linear-gradient(to right, #ffe359 0%, #fff2ac 100%);font-weight: bolder;font-size: 32px;font-family: \'Roboto\', sans-serif;padding: 4px;} body{ background-color: transparent;}',
  google_fonts: "Roboto"
}

// html to http coversion. 
request.post({ url: 'https://hcti.io/v1/image', form: data})
  .auth("851d10e2-3902-4f1d-a649-c7fb42880601", "c61c9262-31be-461c-9a6d-63840dd1b9f2")
  .on('data', function(data) {
    const obj = JSON.parse(data);
    var url = obj.url;

    //URL to image conversion.
    https.get(url,(res) => {
      const path = 'img.jpg'; 
      const filePath = fs.createWriteStream(path);
      res.pipe(filePath);
      filePath.on('finish',() => {
      filePath.close();
      })
    })
  })

//Overlay
function createImage() {
  var co = new CamOverlayAPI({
    'ip': '212.24.145.122',
    'port': 780,
    'auth': 'root:af895d6s',
    'serviceName': 'Drawing Test',
    'serviceID': -1,
    'camera': 0
  });

  co.connect().then(function() {
    co.cairo('cairo_image_surface_create', 'CAIRO_FORMAT_ARGB32', 200, 200).then(function(surfaceRes) {
      var surface = surfaceRes.var;

      co.cairo('cairo_create', surface).then(function(cairoRes) {
        var cairo = cairoRes.var;

        var imgData = fs.readFileSync('img.jpg');
        co.uploadImageData(imgData).then(function(imgSurfaceRes) {
          var imgSurface = imgSurfaceRes.var;

          co.cairo('cairo_translate', cairo, 10, 100);
          co.cairo('cairo_scale', cairo, 0.5, 0.5);
          co.cairo('cairo_set_source_surface', cairo, imgSurface, 0, 0);
          co.cairo('cairo_paint', cairo);
          co.cairo('cairo_surface_destroy', imgSurface);

          co.showCairoImage(surface, -1.0, -1.0).then(function() {
            process.exit(0);
          }, 
          
          function() {
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

createImage();