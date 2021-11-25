var resultView = new Vue({
  el: '#app',
  data: {
    // states
    start: false,
    recording: false,
    backToStart: false,
    // record keeping logic
    map: undefined,
    marker: undefined,
    currentPos: undefined, 
    lastPos: undefined, // used to prevent duplicate coords
    locations: [], // coords of one line
    paths: [], // array of lines (used for static maps)
    polylines: [], // array of Polyline objects (used for undo)
    // map options
    color: "#FFFFFF",
    zoom: 18,
    image_url: '',
    api_key: 'AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E',
    public_key: 'AIzaSyDcwGyRxRbcNGWOFQVT87A1mkxEOfm8t0w'
  },
  methods: {
    restartImage: function() {
      this.locations = [];
      this.paths = [];
      if (this.backToStart) {
        this.backToStart = false;
        this.start = false;
      }
      this.polylines.forEach(poly => {
        poly.setMap(null);
      })
    },
    startGame: function() {
      this.start = true;
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
      console.log("hello2?")
      let recordButton = document.getElementById('record_button');
      if (this.recording === true) {
        this.paths.push(JSON.parse(JSON.stringify(this.locations)));
        this.locations = [];
        
        recordButton.className = 'btn btn-outline-danger'
        $("#record_button span").text('Record');
        let recordToggle = document.getElementById("record_toggle");
        recordToggle.className = 'fa fa-map-pin fa-pull-left'

      } else {
        if (this.locations.length === 0) {
          this.locations.push(this.currentPos);
        }

        recordButton.className = 'btn btn-danger'
        $("#record_button span").text('Recording');
        let recordToggle = document.getElementById("record_toggle");
        recordToggle.className = 'fa fa-pause fa-pull-left'
      }
      this.recording = !this.recording;
    },

    renderEnd: function() {
      if (this.recording) {
        this.recordingHandler();
      }
      let final_str = "";
      this.paths.forEach(path => {
        let path_str = '&path=color:0xff0000ff|weight:5';
        path.forEach(coord => {
          path_str += '|'+ coord.lat + ',' + coord.lng;
        });
        final_str += path_str;
      });
      this.image_url = "https://maps.googleapis.com/maps/api/staticmap?size=390x844&maptype=satellite&key=AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E" + final_str;
    },

    recordButtonConstructor() {
      const recordButton = document.createElement("button");
      recordButton.className = 'btn btn-outline-danger'
      recordButton.id = 'record_button'
      recordButton.setAttribute("aria-label", "Left Align")
      recordButton.setAttribute("style", "margin-top: 8px")

      let text = document.createElement("span");
      text.innerHTML = "Record";
      recordButton.appendChild(text);

      const recordToggle = document.createElement("i");
      recordToggle.id = "record_toggle"
      recordToggle.className = 'fa fa-map-pin fa-pull-left';
      
      recordToggle.setAttribute("aria-hidden", "true");
      recordButton.append(recordToggle);

      recordButton.addEventListener("click", outsideRecordingHandler)

      return recordButton;
    },

    startMenuButtonConstructor() {
      let startButton = document.createElement("button");
      startButton.className = "btn btn-primary";
      startButton.setAttribute("data-bs-toggle", "modal");
      startButton.setAttribute("data-bs-target", "#restartImageModal");
      startButton.addEventListener("click", this.toStart());

      let text = document.createElement("span");
      text.innerHTML = "Back to Menu";
      startButton.appendChild(text);

      return startButton;
    },

    restartButtonConstructor() {
      let restartButton = document.createElement("button");
      restartButton.className = "btn btn-primary";
      restartButton.setAttribute("data-bs-toggle", "modal");
      restartButton.setAttribute("data-bs-target", "#restartImageModal");
      
      let text = document.createElement("span");
      text.innerHTML = "Restart Image";
      restartButton.appendChild(text);

      return restartButton;
    },

    endButtonConstructor() {

      let endButton = document.createElement("button");
      endButton.className = "btn btn-primary";
      endButton.setAttribute("data-bs-toggle", "modal");
      endButton.setAttribute("data-bs-target", "#finalImage");
      endButton.setAttribute("style", "margin-top: 8px")
      endButton.addEventListener("click", outsideRenderHandler);
      
      let text = document.createElement("span");
      text.innerHTML = "Render Final Image";
      endButton.appendChild(text);

      return endButton;
    },

    createMap: async function() {
      // initialize map
      navigator.geolocation.getCurrentPosition(success => {
        const map = new google.maps.Map(document.getElementById("map"), {
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER,
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
      
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(this.recordButtonConstructor());
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(this.endButtonConstructor());
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(this.startMenuButtonConstructor());
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(this.restartButtonConstructor());

      }, error => console.log(error),
      {enableHighAccuracy: true});
    },

    updateMap: function() {
      // track user
      navigator.geolocation.watchPosition(success => {
        const currentPos = {lat: success.coords.latitude, lng: success.coords.longitude};
        this.currentPos = JSON.parse(JSON.stringify(currentPos));
        this.marker.setPosition(this.currentPos);
        this.map.panTo(this.currentPos);
        if (this.recording && (JSON.stringify(this.currentPos) !== JSON.stringify(this.lastPos))) {
          this.lastPos = this.currentPos;
          this.locations.push(this.currentPos);
          const path = new google.maps.Polyline({
            path: this.locations,
            geodesic: true,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 3,
          });
          path.setMap(this.map);
          this.polylines.push(path);
        }
      }, error => console.log(error),
      {enableHighAccuracy: true});
    }
  },

  created() {
    this.createMap();
  },

  updated() {
    this.updateMap();
  }
})


outsideRecordingHandler = function() {
  resultView.recordingHandler();
};

outsideRenderHandler = function() {
  resultView.renderEnd();
};