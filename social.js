var socialView = new Vue({
    el: '#socialfeed',
    data: {
      secret: 'secret',
      posts: [],
    },
    methods: {
        getPosts: function() {
            // make request to https://us-east-1.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/stepartist-kagkq/service/stepartistapi/incoming_webhook/getart?secret=secret
            // and set the posts to the response
            console.log('getPosts');
            fetch('https://us-east-1.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/stepartist-kagkq/service/stepartistapi/incoming_webhook/getart?secret=secret', {
                method: 'GET',
            }).then((response) => response.json()
            ).then(data => {
                this.posts = data;
                console.log(data);
            });
        }
    },
    beforeMount() {
        this.getPosts();
    }
  })