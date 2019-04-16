const weatherMap = {
  'sunny': '晴天',
  'cloudy': '多云',
  'overcast': '阴',
  'lightrain': '小雨',
  'heavyrain': '大雨',
  'snow': '雪'
}

const weatherColorMap = {
  'sunny': '#cbeefd',
  'cloudy': '#deeef6',
  'overcast': '#c6ced2',
  'lightrain': '#bdd5e1',
  'heavyrain': '#c5ccd0',
  'snow': '#aae1fc'
 }

const QQMapWX = require('../../libs/qqmap-wx-jssdk.min.js')

const UNPROMPTED = 0
const UNAUTHORIZED = 1
const AUTHORIZED = 2

Page({
  data: {
    nowTemp: '14°',
    nowWeather: '阴天',
    nowWeatherBackground: '',
    hourlyWeather: [],
    todayDate: '',
    todayTemp: '',
    city: '广州市',
    locationAuthType: UNPROMPTED
  },
  onPullDownRefresh() {
    this.getNow(() => {
      wx.stopPullDownRefresh()
    })
  },
  onLoad() {
    this.qqmapsdk = new QQMapWX({
      key: '247BZ-WFWKU-3R2VO-4453K-EOI75-FHB6C'
    })
    wx.getSetting({
      success: res => {
        let auth = res.authSetting['scope.userLocation']
        this.setData({
          locationAuthType: auth ? AUTHORIZED
            : (auth === false) ? UNAUTHORIZED : UNPROMPTED
        })

        if (auth)
          this.getCityAndWeather()
        else
          this.getNow()
      },
      fail: ()=>{
        this.getNow()
      }
    })
  },
  getNow(callback) {
    wx.request({
      url: 'https://test-miniprogram.com/api/weather/now',
      data: {
        city: this.data.city
      },
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        this.setNow(res)
        this.setHourlyWeather(res)
        this.setToday(res)
      },
      complete: () => {
        callback && callback()
      }
    })
  },
  setNow(res) {
    const { now } = res.data.result
    const temp = now.temp
    const weather = now.weather
    this.setData({
      nowTemp: `${temp}°`,
      nowWeather: weatherMap[weather],
      nowWeatherBackground: `/images/${weather}-bg.png`
    })
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: weatherColorMap[weather],
    })
  },
  setHourlyWeather(res) {
    const { forecast } = res.data.result
    const nowHour = new Date().getHours()
    const hourlyWeather = []
    for (let i = 0; i < 8; i += 1){
      hourlyWeather.push({
          time: `${(i * 3 + nowHour) % 24}时`,
          iconPath: `/images/${forecast[i].weather}-icon.png`,
          temp: `${forecast[i].temp}°`
      })
    }
    hourlyWeather[0].time = '现在'
    this.setData({
      hourlyWeather
    })
  },
  setToday(res) {
    const { today } = res.data.result
    const date = new Date()
    this.setData({
      todayTemp: `${today.minTemp}° - ${today.maxTemp}°`,
      todayDate: `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} 今天`
    })
  },
  onTapDayWeather() {
    wx.navigateTo({
      url: `/pages/list/list?city=${this.data.city}`
    })
  },
  onTapLocation(){
    this.getCityAndWeather()
  },
  getCityAndWeather() {
    wx.getLocation({
      success: res =>{
        this.setData({
          locationAuthType: AUTHORIZED,
        })
        this.qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: res => {
            const city = res.result.address_component.city
            this.setData({
              city,
            })
            this.getNow()
          }
        })
      },
      fail: () => {
        this.setData({
          locationAuthType: UNAUTHORIZED,
        })
      }
    })
  }
})
