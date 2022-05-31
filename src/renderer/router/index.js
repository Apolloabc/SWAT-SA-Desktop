import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

import Layout from '../views/layout/Layout'

const constantRouterMap = [
  // {path: '/', component: () => import('@/views/welcome/Welcome'), hidden: true},
  // {path: '/newProj', component: () => import('@/views/newProj/NewProj'), hidden: true},
  // {path: '/layout', component: () => import('@/views/layout/Layout'), hidden: true},
  {
    path: '/',
    component: Layout,
    redirect: '/newProj',
    children: [
      {
        path: '/welcome',
        name: 'Welcome',
        component: () => import('@/views/welcome/Welcome')
      },{
        path: 'newProj',
        name: 'NewProj',
        component: () => import('@/views/newProj/NewProj')
      },{
        path: 'rawData',
        name: 'RawData',
        component: () => import('@/views/rawData/RawData')
      },{
        path: 'watershedParams',
        name: 'WatershedParams',
        component: () => import('@/views/watershed/Watershed')
      },{
        path: 'hruParams',
        name: 'HruParams',
        component: () => import('@/views/hru/Hru')
      },{
        path: 'modelParams',
        name: 'ModelParams',
        component: () => import('@/views/model/Model')
      },{
        path: 'paramsSummary',
        name: 'ParamsSummary',
        component: () => import('@/views/paramsSummary/ParamsSummary')
      },{
        path: 'simSetting',
        name: 'SimSetting',
        component: () => import('@/views/simSetting/SimSetting')
      },{
        path: 'execution',
        name: 'Execution',
        component: () => import('@/views/execution/Execution')
      },{
        path: 'singleRun',
        name: 'SingleRun',
        component: () => import('@/views/singleRun/SingleRun')
      },{
        path: 'simResult',
        name: 'SimResult',
        component: () => import('@/views/simResult/SimResult')
      },{
        path: 'scoreSA',
        name: 'ScoreSA',
        component: () => import('@/views/scoreSA/ScoreSA')
      }
    ]
  }
]
export default new Router({
  routes: constantRouterMap
})