var resultView = new Vue({
  el: '#app',
  data: {
    // states
    start: false,
    tutorial: false,
    recording: false,
    backToStart: false,
    // record keeping logic
    map: undefined,
    marker: undefined,
    currentPos: undefined, 
    lastPos: undefined, // used to prevent duplicate coords
    locations: [], // coords of one line
    paths: [], // array of line object -- coords and settings (used for static maps)
    polylines: [], // array of Polyline objects (used for undo)
    drawingID: 0, // used to keep of drawing in db
    // map options
    color: "#FF0000",
    thickness: 3,
    opacity: 100,
    zoom: 18,
    image_url: '',
    api_key: 'AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E',
    // public_key: 'AIzaSyDcwGyRxRbcNGWOFQVT87A1mkxEOfm8t0w'
  },
  methods: {
    restartImage: function() {
      this.locations = [];
      this.paths = [];
      if (this.backToStart) {
        this.backToStart = false;
        this.start = false;
      }
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }

      fetch('https://us-east-1.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/stepartist-kagkq/service/stepartistapi/incoming_webhook/getDrawingId').then(res => res.json()).then(data => { 
        this.drawingID = data.id;
      });
    },
    startGame: function() {
      this.start = true;
    },
    openTutorial:function() {
      this.tutorial = true;
    },
    closeTutorial: function() {
      this.tutorial = false;
    },
    toStart: function(){
      this.backToStart = true;
    },
    close: function() {
      this.backToStart = false;
    },
    getImage: function() {
      if (image_url == '') {
        this.image_url = "https://maps.googleapis.com/maps/api/staticmap?size=390x844&maptype=satellite&key=AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E&path=color:0x0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384|40.755823,-73.986397"
        // this.image_url = "https://maps.googleapis.com/maps/api/staticmap?center="+latlon+"&zoom=14&size=400x300&sensor=false&key="
      } else {
        // "https://maps.googleapis.com/maps/api/staticmap?center=40.714728,-73.998672&zoom=12&size=400x400&maptype=satellite&key="
        // "path=color:0x0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384|40.755823,-73.986397"
      }
    },

    shareToTwit() {
      window.open(
        'https://twitter.com/intent/tweet?text=Check%20out%20this%20cool%20drawing%20I%20made%20using%20the%20Step%20Artist%20App!&hashtags=StepArtist',
        '_blank' 
      );
    },

    download_image() {
      axios({
        url: this.image_url,
        method: 'GET',
        responseType: 'blob'
      }).then((response) => {
        var fileUrl = window.URL.createObjectURL(new Blob([response.data]))
        var fileLink = document.createElement('a')
        fileLink.href = fileUrl;
        fileLink.setAttribute('download', 'stepArtistImg.jpg')
        document.body.append(fileLink)
        fileLink.click()
      })
    },

    updateDrawingId() {
      this.drawingID = document.getElementById('drawingID_input').value
      this.getPathsFromServer()
    },

    decimalToHexString(number) {
      // conver the rgb value to hex
      return hex = number.toString(16);
    },

    shareHandler: function(e) {
      var url = "https://us-east-1.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/stepartist-kagkq/service/stepartistapi/incoming_webhook/postart?secret=secret";
      var xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            console.log(xhr.responseText);
        }
      };
      var data = `{
        "name": "${e.target.form.name.value}",
        "title": "${e.target.form.title.value}",
        "description": "${e.target.form.description.value}",
        "url": "${this.image_url}"
      }`;
      xhr.send(data);
    },

    recordingHandler: function() {
      let recordButton = document.getElementById('record_button');
      if (this.recording === true) {
        let path = {
          id: this.drawingID,
          color: this.color,
          thickness: this.thickness,
          opacity: this.opacity,
          locations: this.locations
        };
        this.postData(
          "https://us-east-1.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/stepartist-kagkq/service/stepartistapi/incoming_webhook/addPath",
          path
        )
        
        this.locations = [];
        
        recordButton.className = 'btn btn-danger';
        $("#record_button span").text('   Record');
        let recordToggle = document.getElementById("record_toggle");
        recordToggle.className = 'fa fa-map-pin';

      } else {
        if (this.locations.length === 0) {
          this.locations.push(this.currentPos);
        }

        recordButton.className = 'btn btn-danger';
        $("#record_button span").text('   Recording');
        let recordToggle = document.getElementById("record_toggle");
        recordToggle.className = 'fa fa-pause';
      }
      this.recording = !this.recording;
    },

    copyHandler: function() {
      navigator.clipboard.writeText(this.drawingID).then(function() {
        alert('Copied to clipboard')
      });
      // alert('Copied to clipboard');
    },

    getPathsFromServer: function() {
      fetch('https://us-east-1.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/stepartist-kagkq/service/stepartistapi/incoming_webhook/getPaths?id='+this.drawingID).then(response => {
        return response.json();
      }).then(data => {
        this.paths = data;
        for (var i = 0; i < this.paths.length; i++) {
          const path = new google.maps.Polyline({
            path: this.paths[i].locations,
            geodesic: true,
            strokeColor: this.paths[i].color,
            strokeOpacity: this.paths[i].opacity / 100,
            strokeWeight: this.paths[i].thickness,
          });
          // TODO: Check for duplicate paths
          this.polylines.push(path);
          this.polylines[this.polylines.length - 1].setMap(this.map);
        }

        let final_str = "";
        this.paths.forEach(path => {
          // handling opacity
          let opacity = this.decimalToHexString(parseInt((path["opacity"]/100) * 255));

          // replace # with 0x in color
          let color = path["color"].replace("#", "0x");
          let path_str = '&path=color:' + color + opacity + '|weight:' + path["thickness"] 
          path["locations"].forEach(coord => {
            path_str += '|'+ coord.lat + ',' + coord.lng;
          });
          final_str += path_str;
        });
        this.image_url = "https://maps.googleapis.com/maps/api/staticmap?size=390x844&maptype=satellite&center=" + this.map.getCenter().lat() + "," + this.map.getCenter().lng() + "&zoom=" + this.map.getZoom() + "&key=AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E" + final_str;
      });
    },

    renderEnd: function() {
      // console.log(this.color);
      if (this.recording) {
        this.recordingHandler();
      } else {
        this.getPathsFromServer()
      }
    },

    recordButtonConstructor() {
      const recordButton = document.createElement("button");
      recordButton.className = 'btn btn-danger';
      recordButton.id = 'record_button';
      recordButton.setAttribute("aria-label", "Left Align");
      recordButton.setAttribute("style", "margin-bottom: 20px; width: 60%; height: 8%; font-size: 250%; text-align: center");

      const recordToggle = document.createElement("i");
      recordToggle.id = "record_toggle";
      recordToggle.className = 'fa fa-map-pin';
      recordToggle.setAttribute("aria-hidden", "true");
      recordButton.append(recordToggle);

      let text = document.createElement("span");
      text.innerHTML = "   Record";
      recordButton.appendChild(text);

      recordButton.addEventListener("click", outsideRecordingHandler);

      return recordButton;
    },

    endButtonConstructor() {

      let endButton = document.createElement("button");
      endButton.className = "btn btn-primary";
      endButton.setAttribute("data-bs-toggle", "modal");
      endButton.setAttribute("data-bs-target", "#finalImage");
      endButton.addEventListener("click", outsideRenderHandler);
      
      let text = document.createElement("span");
      text.innerHTML = "Render Final Image";
      endButton.appendChild(text);

      return endButton;
    },

    menuButtonConstructor() {

      let menuButton = document.createElement("button");
      menuButton.className = "btn btn-light";
      menuButton.setAttribute("data-bs-toggle", "modal");
      menuButton.setAttribute("data-bs-target", "#menuModal");
      menuButton.setAttribute("style", "padding: 5px; height: 40px; width: 40px; margin-left: 10px; margin-bottom: 5px; margin-top: 5px;")
      
      let img = document.createElement("img");
      img.setAttribute("src", "img/Hamburger_icon.png");
      img.setAttribute("style", "height: 100%; width: 100%; border-radius: 10px;")
      menuButton.appendChild(img);

      return menuButton;
    },

    centerButtonConstructor() {

      let centerButton = document.createElement("button");
      centerButton.className = "btn btn-light";
      centerButton.setAttribute("style", "margin: 5px; height: 8%; width: 8%;");
      
      centerButton.addEventListener("click", outsideGetMap)
      
      let img = document.createElement("img");
      img.setAttribute("src", "img/center_map.png");
      img.setAttribute("style", "margin-bottom: 20px; height: 100%; width: 100%; border-radius: 10px;")
      centerButton.appendChild(img);

      return centerButton;
    },

    drawLine() {
      var canvas = document.getElementById('drawingCanvas');
      var context = canvas.getContext("2d");

      // color
      context.strokeStyle = this.color;

      // thickness
      context.lineWidth = this.thickness;

      // opacity
      context.globalAlpha = this.opacity / 100.0;

      context.clearRect(0,0,canvas.width,canvas.height);
      // next draw 
      context.beginPath();
      context.moveTo(10,75);
      context.lineTo(290,75);
      context.stroke();
    },

    postData:  function(url = '', data = {}) {
      // Default options are marked with *
      const response = fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
      }).then(() => {
        this.getPathsFromServer();
      });
      

      // console.log(data);
      //console.log(response);
      return response.status; // parses JSON response into native JavaScript objects
    },
    
    createMap: async function() {
      // initialize map
      navigator.geolocation.getCurrentPosition(success => {
        map = new google.maps.Map(document.getElementById("map"), {
          zoomControl: true, 
          disableDefaultUI: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_TOP,
          },
          streetViewControl: false,
        });
        map.setMapTypeId("satellite");
        map.setZoom(this.zoom);
        const initPos = {lat: success.coords.latitude, lng: success.coords.longitude};
        this.currentPos = initPos;
        this.lastPos = initPos;
        map.panTo(initPos);
        map.setTilt(0);
        const marker = new google.maps.Marker({ map, position: initPos });
        this.map = map;
        this.marker = marker;
      
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(this.recordButtonConstructor());
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.menuButtonConstructor());
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(this.endButtonConstructor());
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(this.centerButtonConstructor());

        // initialize thickness line
        this.drawLine();

      }, error => console.log(error),
      {enableHighAccuracy: true});
    },

    updateMap: function() {
      // track user
      navigator.geolocation.watchPosition(success => {
        const currentPos = {lat: success.coords.latitude, lng: success.coords.longitude};
        console.log(currentPos);
        this.currentPos = JSON.parse(JSON.stringify(currentPos));
        this.marker.setPosition(this.currentPos);
        if (this.recording && (JSON.stringify(this.currentPos) !== JSON.stringify(this.lastPos))) {
          this.lastPos = this.currentPos;
          this.locations.push(this.currentPos);
          path = new google.maps.Polyline({
            path: this.locations,
            geodesic: true,
            strokeColor: this.color,
            strokeOpacity: this.opacity / 100,
            strokeWeight: this.thickness,
          });

          this.polylines.push(path);
          this.polylines[this.polylines.length - 1].setMap(this.map);
        }
        // console.log(this.locations)
      }, error => console.log(error),
      {enableHighAccuracy: true});
    }
  },

  created() {
    this.createMap();
    fetch('https://us-east-1.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/stepartist-kagkq/service/stepartistapi/incoming_webhook/getDrawingId').then(res => res.json()).then(data => { 
      this.drawingID = data.id;
    });
  },

  updated() {
    this.updateMap();
  }
})

outsideGetMap = function() {
  resultView.map.panTo(resultView.currentPos);
}

outsideRecordingHandler = function() {
  resultView.recordingHandler();
};

outsideRenderHandler = function() {
  resultView.renderEnd();
};

outsideToStart = function() {
  resultView.toStart();
}