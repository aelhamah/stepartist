var resultView = new Vue({
  el: '#app',
  data: {
    start: false,
    latitude: 0,
    longitude: 0,
    locations: [],
    map: undefined,
    marker: undefined,
    currentPos: undefined,
    currentPath: undefined,
    center: {lat: 0, lng: 0},
    paths: [],
    color: "#FFFFFF",
    recording: false,
    zoom: 18,
    image_url: '',
    backToStart: false,
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
        }};

      var data = `{
        "name": "${e.target.form.name.value}",
        "title": "${e.target.form.title.value}",
        "description": "${e.target.form.description.value}",
        "url": "${this.image_url}"
      }`;

      xhr.send(data);
    },

    recordingHandler: function() {
      if (this.recording === true) {
        this.paths.push(JSON.parse(JSON.stringify(this.locations)));
        this.locations = [];
      } else {
        if (this.locations.length === 0) {
          this.locations.push(this.currentPos);
        }
      }
      this.recording = !this.recording;
    },

    endHandler: function() {
      this.locations = [];
      this.paths.push(this.currentPath);
    },

    renderEnd: function() {
      if (this.recording) {
        this.recordingHandler();
      }
      let final_str = "";
      this.paths.forEach(path => {
        let path_str = '&path=color:0x0000ff|weight:5';
        path.forEach(coord => {
          path_str += '|'+ coord.lat + ',' + coord.lng;
        });
        final_str += path_str;
      });
      this.image_url = "https://maps.googleapis.com/maps/api/staticmap?size=390x844&maptype=satellite&key=AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E" + final_str;
    }
  },

  beforeCreate() {
    if (navigator.geolocation) {
      // initialize map
      navigator.geolocation.getCurrentPosition(success => {
        const map = new google.maps.Map(document.getElementById("map"));
        map.setMapTypeId("satellite");
        map.setZoom(this.zoom);
        const initPos = {lat: success.coords.latitude, lng: success.coords.longitude};
        this.currentPos = initPos;
        map.panTo(initPos);
        const marker = new google.maps.Marker({ map, position: initPos });
        this.map = map;
        this.marker = marker;
      }, error => console.log(error),
      {enableHighAccuracy: true});
    }
  },

  updated() {
    if (navigator.geolocation) {
      // track user
      navigator.geolocation.watchPosition(success => {
        const currentPos = {lat: success.coords.latitude, lng: success.coords.longitude};
        this.currentPos = JSON.parse(JSON.stringify(currentPos));
        this.marker.setPosition(this.currentPos);
        this.map.panTo(this.currentPos);
        if (this.recording) {
          this.locations.push(this.currentPos);
          const path = new google.maps.Polyline({
            path: this.locations,
            geodesic: true,
            strokeColor: "#FF0000",
            strokeOpacity: 0.7,
            strokeWeight: 3,
          });
          path.setMap(this.map);
          this.currentPath = path;
        }
      }, error => console.log(error),
      {enableHighAccuracy: true});
    }
  }
})