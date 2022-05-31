import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

import Echarts from 'echarts'


import App from './App'
import router from './router'
import i18n from './i18n/i18n'

Vue.use(ElementUI)
Vue.config.productionTip = false
Vue.prototype.echarts = Echarts

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  i18n,
  template: '<App/>'
}).$mount('#app')
