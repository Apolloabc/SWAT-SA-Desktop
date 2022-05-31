<template>
  <el-card class="setting-card" shadow="always">
    <el-form :model="simSetting" label-width="200px" :rules="rules" ref="simSetting" class="setting-form">
      
      <el-form-item :label="$t('message.saMethod')">
        <el-select v-model="simSetting.saMethod" size="small" >
          <el-option
            v-for="item in saMethod"
            :key="item.value"
            :label="item.label"
            :value="item.value"       
            :disabled="item.disabled" style="font-family:'Times New Roman';">
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('message.simTimes')" prop="simTimes">
        <div v-if="simSetting.saMethod==0">
          <el-input-number v-model="simSetting.simTimes" controls-position="right" size="small" :min="66"></el-input-number>
          <span> * {{paramsSum.length}} = {{simSetting.simTimes * paramsSum.length}}</span>
        </div>
        <div v-if="simSetting.saMethod==1">
          <el-input-number v-model="simSetting.simTimes" controls-position="right" size="small" :min="0"></el-input-number>
          <span> * ({{paramsSum.length}} + 1) = {{simSetting.simTimes * (paramsSum.length+1)}}</span>
        </div>
        <div v-if="simSetting.saMethod==2">
          <el-input-number v-model="simSetting.simTimes" controls-position="right" size="small" :min="0"></el-input-number>
          <span> * (2 * {{paramsSum.length}}+ 2)  = {{simSetting.simTimes * (2*paramsSum.length+2)}}</span>
        </div>
        <div v-if="simSetting.saMethod==3">
          <el-input-number v-model="simSetting.simTimes" controls-position="right" size="small" :min="65"></el-input-number>
          <span> * {{paramsSum.length}} = {{simSetting.simTimes * paramsSum.length}}</span>
        </div>

      </el-form-item>
      <el-form-item :label="$t('message.simRange')" prop="simRange">
        <el-date-picker
          v-model="simSetting.simRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          :range-separator="$t('message.to')"
          :start-placeholder="$t('message.startDate')"
          :end-placeholder="$t('message.endDate')"
          size="small">
        </el-date-picker>
      </el-form-item>
      <el-form-item :label="$t('message.timeReso')">
        <el-select v-model="simSetting.timeStep" size="small" >
          <el-option
            v-for="item in timeStep"
            :key="item.value"
            :label="item.label"
            :value="item.value"       
            :disabled="item.disabled" style="font-family:'Times New Roman';">
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('message.shapePoint')" v-if="projInfo.type==1"> 
        <el-button @click="selectPath('waterStationShp')" icon="el-icon-folder" size="small"></el-button>
        <span style="margin-left: 10px">{{simSetting.waterStationShp}}</span>
      </el-form-item>
      <el-form-item :label="$t('message.txtWatershed')" v-if="projInfo.type==0"> 
        <el-button @click="selectPath('basinTxt')" icon="el-icon-folder" size="small"></el-button>
        <span style="margin-left: 10px">{{simSetting.basinTxt}}</span>
      </el-form-item>

      <el-form-item :label="$t('message.simTargets')">
        <el-checkbox-group v-model="simSetting.simTargets" @change="refreshObserved" size="small">
          <el-checkbox-button  v-for="target in targets" :label="target" :key="target">{{target}}</el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>
      
      <el-form-item :label="$t('message.observation')">
        <el-switch
          v-model="simSetting.observed"
          :active-text="$t('message.haveObs')"
          :inactive-text="$t('message.noObs')">
        </el-switch>
      </el-form-item>

      <!-- 观测数据的Form -->
      <el-form label-width="200px" v-if="simSetting.observed">
        <el-divider>{{$t('message.splitLine')}}</el-divider>
        
        <el-form-item :label="$t('message.objective')">
          <el-checkbox-group v-model="simSetting.objective" size="small">
            <el-tooltip v-for="(obj,key) in objFunctions" :key="key" :content="obj.desc" effect="light">
              <div slot="content">{{obj.desc}}<br/><img :src="obj.img" style="width:240px"/></div>
              <el-checkbox-button  :label="obj.value" :key="obj.value">{{obj.value}}</el-checkbox-button>
            </el-tooltip>
            <!-- <el-checkbox-button v-for="obj in objFunctions" :label="obj" :key="obj">{{obj}}</el-checkbox-button> -->
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-for="(target,key) in observedInfo" :key="key" :label="$t('message.strObs')+target.name">
          <el-button @click="selectPath(target.name)" icon="el-icon-folder" size="small"></el-button>
          <span style="margin-left: 10px">{{target.path}}</span>
        </el-form-item>
        <el-popover trigger="click">
          <pre>{{format}}</pre>
          <el-button type="text" slot="reference" style="float:right">{{$t('message.formatHint')}}</el-button>
        </el-popover>
      </el-form>
      
    </el-form>
  </el-card>
</template>

<script>
const {ipcRenderer} = require('electron')
export default {
  props:['simSetting','observedInfo','paramsSum','projInfo'],
  methods:{
    selectPath(name){
      this.currentObs = name
      var options = {
        title: 'Select the observation of Flow',
        filters: [
          { name: 'TXT', extensions: ['txt'] }
        ]
      }
      switch (name) {
        case 'waterStationShp':
          options.title = 'Select the point data of hydrological station'
          options.filters[0] = {name:'Shapefile',extensions:['shp']}
          ipcRenderer.send('select-file-dialog2',options)
          break
        case 'basinTxt':
          options.title = 'Select the basin id where the hydrological station is located'
          ipcRenderer.send('select-file-dialog2',options)
          break
        case 'Flow':
          options.title = 'Select the observation of Flow'
          ipcRenderer.send('select-file-dialog2',options)
          break
        case 'NO3':
          options.title = 'Select the observation of NO3'
          ipcRenderer.send('select-file-dialog2',options)
          break
        case 'NH4':
          options.title = 'Select the observation of NH4'
          ipcRenderer.send('select-file-dialog2',options)
          break
        case 'TP':
          options.title = 'Select the observation of TP'
          ipcRenderer.send('select-file-dialog2',options)
          break
       }
    },
    refreshObserved(){
      var newObs = []
      this.simSetting.simTargets.forEach(tar => {
        for(var i=0; i<this.observedInfo.length; i++){
          var obs = this.observedInfo[i]
          if(tar == obs.name) {
            newObs.push(obs)
            break
          }
        }
        if(i>=this.observedInfo.length){
          var obs = {
            name: tar,
            path:''
          }
          newObs.push(obs)
        }
      })
      this.$emit('update:observedInfo',newObs)
    }
  },
  mounted(){
    var that = this
    ipcRenderer.on('selected-file2', (event, path) => {
      that.observedInfo.forEach(obs => {
        if(obs.name == that.currentObs){
          obs.path = path[0]
          that.currentObs = ""
        }
      })
      if(that.currentObs == 'waterStationShp'){
        that.simSetting.waterStationShp = path[0]
        that.currentObs = ""
      }
      if(that.currentObs == 'basinTxt'){
        that.simSetting.basinTxt = path[0]
        that.currentObs = ""
      }
    })
  },
  data(){
    var checkSimTimes = (rule, value, callback) => {
      if(!value){
        return callback(new Error('Please enter the times of simulation'))
      }else{
        callback()
      }
    }
    var checkSimRange = (rule, value, callback) => {
      if(!value){
        return callback(new Error('Please select the period of simulation'))
      }else{
        callback()
      }
    }
    return{

      rules:{
        simTimes:[
          {validator: checkSimTimes, trigger: 'blur'}
        ],
        simRange:[
          {validator: checkSimRange, trigger: 'blur'}
        ],
      },

      saMethod:[
        {
          value:0,
          label:'eFAST'
        },
        {
          value:1,
          label:'Morris'
        },
        {
          value:2,
          label:'Sobol'
        },
        {
          value:3,
          label:'FAST'
        }
      ],

      objFunctions:[
        {
          value:'NSE',
          desc:'Nash–Sutcliffe',
          img:'./static/images/NSE.png'
        },
        {
          value:'RSquared',
          desc:'R-Squared',
          img:'./static/images/R².png'
        },
        {
          value:'PBIAS',
          desc:'Percent Bias',
          img:'./static/images/PBIAS.png'
        },
        // {
        //   value:'RMSE',
        //   desc:'Root-Mean-Square Error',
        //   img:'./static/images/RMSE.png'
        // },
        // {
        //   value:'MAPE',
        //   desc:'Mean Absolute Percentage Error',
        //   img:'./static/images/MAPE.png'
        // }
      ],
      targets:['Flow','Sed','TN','TP','DO','NO3','NH4'],
      timeStep:[
        {
          value:0,
          label:'Monthly'
        },
        {
          value:1,
          label:'Daily',
          disabled: true
        },
        {
          value:2,
          label:'Yearly',
          disabled: true
        }
      ],
      currentObs:'',
      format:'201301(monthly)\n0.1\n0.3\n...',
    }
  }
}
</script>

<style>
.setting-card{
  width: 80%;
  margin: auto;
  font-family:'Times New Roman';
}
/* .setting-form{
  margin: 0 5%;
} */
</style>