var socialView = new Vue({
    el: '#socialfeed',
    data: {
      secret: 'secret',
      posts: [],
      timer: '',
    },
    created () {
      this.getPosts();
      // update every 15 seconds
      this.timer = setInterval(this.getPosts, 15000);
  },
    methods: {
        getPosts: function() {
            console.log('getPosts');
            fetch('https://us-east-1.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/stepartist-kagkq/service/stepartistapi/incoming_webhook/getart?secret=secret', {
                method: 'GET',
            }).then((response) => response.json()
            ).then(data => {
                // process data
                for (var i = 0; i < data.length; i++) {
                    if (data[i].url == null || data[i].url == '') {
                      data[i].url = 'img/local-file-not-found.png'
                    }
                    if (data[i].title == null || data[i].title == '') {
                      data[i].title = 'Untitled'
                    }
                }

                this.posts = data;
                console.log(data);
            });
        },
        cancelAutoUpdate () {
          clearInterval(this.timer);
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
        }
    },
  })