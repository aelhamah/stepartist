var resultView = new Vue({
  el: '#app',
  data: {
    latitude: 0,
    longitude: 0,
    // locations: [{ lat: 42.281599, lng: -83.677873 },
    //   { lat: 42.220381, lng: -83.818647 }],
    locations: [],
    // lat_sum: 42.281599 + 42.220381,
    // lon_sum: -83.677873 + -83.818647,
    center: {lat: 0, lng: 0},
    paths: [],
    color: "#FFFFFF",
    recording: false,
    zoom: 4,
    image_url: 'https://maps.googleapis.com/maps/api/staticmap?size=390x844&maptype=satellite&key=AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E&path=color:0x0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384|40.755823,-73.986397',
    api_key: 'AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E',
    public_key: 'AIzaSyDcwGyRxRbcNGWOFQVT87A1mkxEOfm8t0w'
  },
  methods: {
    getImage: function() {
      if (image_url == '') {
        this.image_url = "https://maps.googleapis.com/maps/api/staticmap?size=390x844&maptype=satellite&key=AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E&path=color:0x0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384|40.755823,-73.986397"
        // this.image_url = "https://maps.googleapis.com/maps/api/staticmap?center="+latlon+"&zoom=14&size=400x300&sensor=false&key="
      } else {
        // "https://maps.googleapis.com/maps/api/staticmap?center=40.714728,-73.998672&zoom=12&size=400x400&maptype=satellite&key="
        // "path=color:0x0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384|40.755823,-73.986397"
      }

    },

    // getLocation: function() {
    //   if (navigator.geolocation) {
    //     navigator.geolocation.getCurrentPosition(this.capturePosition);
    //   } else {
    //     var error = "Geolocation is not supported by this browser.";
    //   }
    // },

    recordingHandler: function() {
      this.recording = !this.recording;
      this.updateMap()

    },
    // capturePosition: function(position) {
    //   this.latitude = position.coords.latitude
    //   this.longitude = position.coords.longitude
    //   if(this.locations.length == 0) {
    //     this.center.lat = this.latitude
    //     this.center.lng = this.longitude
    //     this.lat_sum = this.latitude
    //     this.lon_sum = this.longitude
    //   } else {
    //     this.lat_sum += this.latitude
    //     this.lon_sum += this.longitude
    //     this.center.lat = this.lat_sum/(this.locations.length + 1)
    //     this.center.lng = this.lon_sum/(this.locations.length + 1)
    //   }
    //   console.log(this.center)
    //   this.locations.push({lat: this.latitude, lng: this.longitude})
    //   this.updateMap()
    // },

    endHandler: function() {
      const path = new google.maps.Polyline({
        path: this.locations,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 0.7,
        strokeWeight: 3,
      });

      console.log(this.color)
      console.log("end path")

      // clear locations
      this.locations = []
      this.paths.push(path);
    },

    updateMap: function() {
      // this.drawing.push({"style": , "thickness": , "path": }) -- for mongo
      path_str = 'path=color:0x0000ff|weight:5'
      for (var i = 0; i < this.locations.length; i++) {
        path_str += '|'+ this.locations[i].lat + ',' + this.locations[i].lng 
      }
      this.image_url = "https://maps.googleapis.com/maps/api/staticmap?size=390x844&maptype=satellite&key=AIzaSyAb-WxU0LPAk9xKev3DjNGxC90rmJH9V0E&" + path_str

      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: this.zoom,
        center: this.center,
        mapTypeId: "satellite",
      });
      
      const path = new google.maps.Polyline({
        path: this.locations,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 0.7,
        strokeWeight: 3,
      });

      // render current line 
      path.setMap(map);
    
      // rerender all past lines
      this.paths.forEach(function(curr_path) {
        curr_path.setMap(map);
      });
    }
  },

  beforeMount() {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(position => {
        this.center.lat = position.coords.latitude
        this.center.lng = position.coords.longitude
        this.zoom = 18
        // if recording, add to locations
        if (this.recording) {
          this.locations.push({lat: position.coords.latitude, lng: position.coords.longitude})
        }
        console.log("Location: {" + this.center.lat + " " + this.center.lng + "}")
        this.updateMap()
      });
      // navigator.geolocation.getCurrentPosition(position => {
      //   this.center.lat = position.coords.latitude
      //   this.center.lng = position.coords.longitude
      //   this.zoom = 18
      //   this.updateMap()
      // })
    }
  }
})