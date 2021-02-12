const JWPlatformAPI = require('jwplatform');

const jwAPI = new JWPlatformAPI({
    apiKey:'4l9dIkdn',
    apiSecret: 'qJDK4xEClcmllrPcSVm3fmho'
});

jwAPI.videos.show({video_key: 'NRO32dhz'}).then(response => {
    console.log(response.video)
})