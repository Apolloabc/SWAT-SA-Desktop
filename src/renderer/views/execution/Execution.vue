<template>
  <div>
    <el-steps :active="activeStep" align-center>
      <el-step :title="$t('message.step1')" icon="el-icon-s-grid"></el-step>
      <el-step :title="$t('message.step2')" icon="el-icon-caret-right"></el-step>
      <el-step :title="$t('message.step3')" icon="el-icon-check"></el-step>
    </el-steps>
    <!-- 采样 -->
    <div v-if="activeStep == 1"  style="text-align: center;">
      <el-card class="finish-step-card" shadow="always" v-if="paramsSample.length <= 1" id="sampleNote">
        {{$t('message.sampleNote')}}
      </el-card>
      <el-card class="finish-step-card" shadow="always" v-else id="sampleSuccess" >
        {{$t('message.sampleSuccess')}}
      </el-card>
      <el-button type="primary" round @click="startSampling" :disabled="paramsSample.length!=0" style="margin-top: 1%;font-family: 'Tahoma';">{{$t('message.startSampling')}}</el-button>
      <el-button type="primary" round @click="resampling" :disabled="paramsSample.length==0" style="margin-top: 1%;font-family: 'Tahoma';">{{$t('message.resampling')}}</el-button>
    </div>
    <!-- 运行 -->
    <div v-if="activeStep == 2"  style="text-align: center;">
      <el-progress :text-inside="true" :stroke-width="20" :percentage="runningTip.percentage" status="success" style="height: 20px;margin: 1% 5%;"></el-progress>
      <el-table
        :data="currentParams"
        row-key="name"
        :span-method="objectSpanMethod"
        height="450"
        class="paramTable">
        <el-table-column header-align="center" :key="runningTip.runningNum">
          <template slot="header">
            <span>{{$t('message.executionTitle')}}</span>
            <span style="float:right;margin-right:20px">{{runningTip.runningNum+"/"+runningTip.total}}</span>
            <span style="float:right;margin-right:20px">{{$t('message.remainingTime') + " " + runningTip.remainingTime.hour+
              ":"+runningTip.remainingTime.minute+":"+runningTip.remainingTime.second}}</span>
          </template>
          <el-table-column
            prop="submodel"
            :label="$t('message.submodelColumn')"
            width="160">
          </el-table-column>
          <el-table-column
            prop="name"
            :label="$t('message.paramColumn')"
            width="120">
          </el-table-column>
          <el-table-column
            prop="desc"
            :label="$t('message.descColumn')">
          </el-table-column>
          <el-table-column
            prop="value"
            :label="$t('message.valueColumn')"
            width="100">
          </el-table-column>
        </el-table-column>
      </el-table>
      <el-tooltip class="item" effect="light" :content="$t('message.startRuningTip')" placement="top">
        <el-button type="primary" round @click="startRunning" :disabled="runningTip.total==0 || runningTip.runningNum>1" style="margin-top: 1%">{{$t('message.startRunning')}}</el-button>
      </el-tooltip>
      <el-button type="primary" round @click="pauseRunning" :disabled="runningTip.runningNum<=1 ||runningTip.percentage==100" style="margin-top: 1%">{{$t('message.pauseRunning')}}</el-button>
      <el-button type="primary" round @click="continueRunning" :disabled="runningTip.total==0 || !(runningTip.stop==true && runningTip.percentage==100)" style="margin-top: 1%">{{$t('message.continueRunning')}}</el-button>
      <el-button type="primary" round @click="cancelRunning" :disabled="runningTip.total==0 || !(runningTip.stop==true && runningTip.percentage==100)" style="margin-top: 1%">{{$t('message.cancelRunning')}}</el-button>
    </div>
    <!-- 运行结束 -->
    <div v-if="activeStep == 3">
      <el-card class="finish-step-card" shadow="always" v-if="runningTip.total ==0 ||runningTip.runningNum < runningTip.total"  id="runNote">
        {{$t('message.runNote')}}
      </el-card>
      <el-card class="finish-step-card" shadow="always" v-else id="runSuccess">
        {{$t('message.runSuccess')}}
      </el-card>
      <template  v-for="target in calibrationResult" >
        <el-divider :key="target.name" style="width: 90%;margin: 24px auto;">{{$t('message.optimalTitle')}} ({{target.name}})</el-divider>
        <!-- NSE -->
        <el-table v-if="target.parasNSE != undefined"
          :data="target.parasNSE"
          :key="target.optimalNSE"
          border
          class="paramTable" style="margin: 5px auto;">
          <el-table-column header-align="center">
            <template slot="header">
              <span>NSE = {{target.optimalNSE}}</span>
            </template>
            <el-table-column
              v-for="(item,key) in paramsList"
              :key="key"
              :prop="item"
              :label="item">
            </el-table-column>
          </el-table-column>
        </el-table>
        <!-- RSquared -->
        <el-table v-if="target.parasRSquared != undefined"
          :data="target.parasRSquared"
          :key="target.optimalRSquared"
          border
          class="paramTable" style="margin: 5px auto;">
          <el-table-column header-align="center">
            <template slot="header">
              <span>RSquared = {{target.optimalRSquared}}</span>
            </template>
            <el-table-column
              v-for="(item,key) in paramsList"
              :key="key"
              :prop="item"
              :label="item">
            </el-table-column>
          </el-table-column>
        </el-table>
        <!-- PBIAS -->
        <el-table v-if="target.parasPBIAS != undefined"
          :data="target.parasPBIAS"
          :key="target.optimalPBIAS"
          border
          class="paramTable" style="margin: 5px auto;">
          <el-table-column header-align="center">
            <template slot="header">
              <span>PBIAS = {{target.optimalPBIAS}}</span>
            </template>
            <el-table-column
              v-for="(item,key) in paramsList"
              :key="key"
              :prop="item"
              :label="item">
            </el-table-column>
          </el-table-column>
        </el-table>

        <!-- abandoned -->
        <!-- RMSE -->
        <el-table v-if="target.parasRMSE != undefined"
          :data="target.parasRMSE"
          :key="target.optimalRMSE"
          border
          class="paramTable" style="margin: 5px auto;">
          <el-table-column header-align="center">
            <template slot="header">
              <span>RMSE = {{target.optimalRMSE}}</span>
            </template>
            <el-table-column
              v-for="(item,key) in paramsList"
              :key="key"
              :prop="item"
              :label="item">
            </el-table-column>
          </el-table-column>
        </el-table>
        <!-- MAPE -->
        <el-table v-if="target.parasMAPE != undefined"
          :data="target.parasMAPE"
          :key="target.optimalMAPE"
          border
          class="paramTable" style="margin: 5px auto;">
          <el-table-column header-align="center">
            <template slot="header">
              <span>MAPE = {{target.optimalMAPE}}</span>
            </template>
            <el-table-column
              v-for="(item,key) in paramsList"
              :key="key"
              :prop="item"
              :label="item">
            </el-table-column>
          </el-table-column>
        </el-table>
      </template>
      
    </div>
    <div style="text-align: right;margin-right: 5%;">
      <el-button style="font-family: 'Tahoma';" @click="refreshStep(-1)" v-if="activeStep > 1">{{$t('message.previousBtn')}}</el-button>
      <el-button style="font-family: 'Tahoma';" @click="refreshStep(1)" v-if="activeStep < 3">{{$t('message.nextBtn')}}</el-button>
    </div>
  </div>
</template>

<script>

const {ipcRenderer} = require('electron')
var progress
export default {
  props:['activeStep','runningTip','paramsSum','simSetting','observedInfo','paramsSample',
    'calibrationResult','projInfo'],
  methods:{
    refreshStep(a){
      this.$emit('update:activeStep',this.activeStep + a)
    },
    
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      if (columnIndex === 0) {
        if (this.waterNum >0 && this.waterNum - rowIndex === this.waterNum) {
          return {
            rowspan: this.waterNum,
            colspan: 1
          };
        }else if(this.hruNum>0 && this.hruNum + this.waterNum - rowIndex === this.hruNum){
          return{
            rowspan: this.hruNum,
            colspan: 1
          }
        }else if(this.paramsSum.length - rowIndex == this.modelNum){
          return{
            rowspan: this.modelNum,
            colspan: 1
          }
        }else {
          return {
            rowspan: 0,
            colspan: 0
          };
        }
      }
    },
    
    // 采样
    startSampling(){
      ipcRenderer.send('start-sampling',this.simSetting.saMethod)
    },
    // 重新采样
    resampling(){
      var paramsSample = []
      this.$emit('update:paramsSample',paramsSample)
      setTimeout(()=>{
        // 删除已生成的文件
        ipcRenderer.send('re-delete-simResult',this.simSetting.simTargets)
        // 默认就是覆盖生成
        ipcRenderer.send('start-sampling',this.simSetting.saMethod)
        
        this.runningTip.percentage = 0
      },1000)
    },
    
    startRunning(){
      this.runningTip.percentage = 0
      this.currentRun.num = this.runningTip.runningNum
      this.currentRun.finish = false
      // 根据项目类型，判断是否运行数据前处理程序 1 raw data 运行；0 TxtInOut 不运行
      var preExe = this.projInfo.type
      ipcRenderer.send('start-running',this.runningTip.runningNum,preExe)
      progress = setInterval(()=>{
        if(this.runningTip.percentage < 99){
          this.runningTip.percentage += 1
        }
      },1000)
    },

    pauseRunning(){
      this.$notify.info({
        title: this.$t('message.messageTitle'),
        message: this.$t('message.pauseMessage')
      });
      this.runningTip.stop = true
    },

    continueRunning(){
      this.$notify.info({         
        title: this.$t('message.messageTitle'),        
        message: this.$t('message.continueMessage')
      });
      this.runningTip.stop = false
      if(this.runningTip.runningNum < this.runningTip.total){
        this.runningTip.runningNum += 1

        // this.currentParams = []

        for(var i=0; i<this.currentParams.length; i++){
          var para = this.currentParams[i]
          para.value = this.paramsSample[this.runningTip.runningNum-1][para.name]
          // this.currentParams.push(para)
        }

        this.startRunning()

      }else{
        // 运行结束，计算敏感性得分
        ipcRenderer.send('compute-SA',this.simSetting.simTargets,this.simSetting.saMethod)
        // 运行结束，读取模拟结果
        ipcRenderer.send('get-simulation-result',this.simSetting.simTargets)
        
        // 运行结束，计算目标函数
        if(this.simSetting.observed){
          ipcRenderer.send('compute-objective',this.simSetting.objective,this.observedInfo)
        }
      }
    },

    cancelRunning(){
      this.$confirm( this.$t('message.cancelMessage'), this.$t('message.cancelTitle'), {
        confirmButtonText: this.$t('message.selectConfirm'),
        cancelButtonText: this.$t('message.selectCancel'),
        type: 'warning',
        center: true
      }).then(() => {
        // 初始化已修改的参数
        this.runningTip.runningNum = 1
        this.runningTip.percentage = 0
          // 计算剩余秒数
        if(this.waterNum > 0 || this.hruNum > 0){
          this.runningTip.remainingTime.totalSeconds = 100 * this.runningTip.total
        }else{
          this.runningTip.remainingTime.totalSeconds = 100 + 7 * (this.runningTip.total-1)
        }
        var totalSeconds = this.runningTip.remainingTime.totalSeconds
        this.runningTip.remainingTime.hour = parseInt(totalSeconds / (60*60))
        totalSeconds = totalSeconds%(60*60)
        this.runningTip.remainingTime.minute = parseInt(totalSeconds / 60)
        totalSeconds = totalSeconds%60
        this.runningTip.remainingTime.second = parseInt(totalSeconds)

        this.runningTip.stop = false
        

         for(var i=0; i<this.currentParams.length; i++){
          var para = this.currentParams[i]
          para.value = this.paramsSample[0][para.name]
          // this.currentParams.push(para)
        }
        
        // 删除已生成的文件
        ipcRenderer.send('delete-simResult',this.simSetting.simTargets)

      }).catch(()=>{
          
      })
      
    }

  },
  mounted(){

    // 统计所选参数中各类型数量，生成表头
    this.paramsSum.forEach(param => {
      this.paramsList.push(param.name)
      switch(param.submodel){
        case 'Watershed Delineation':
          this.waterNum++
          break
        case 'HRU Creation':
          this.hruNum++
          break
        case 'SWAT Execution':
          this.modelNum++
          break
      }
      // currentParams 需要增加一个属性
      var para = param
      this.currentRun.num = this.runningTip.runningNum
      // para.value = this.paramsSample[0][param.name] // 从采样中取出一组参数
      // 判断开始运行后重新进入，更新currentParams
      if(this.runningTip.runningNum > 0){
        para.value = this.paramsSample[this.runningTip.runningNum-1][param.name]
      }
      this.currentParams.push(para)
    })
    
    var that = this;
    
    // TEST
    // 运行结束，计算敏感性得分
    // ipcRenderer.send('compute-SA',that.simSetting.simTargets,that.simSetting.saMethod)

    // 展示从后端取回的采样数据
    ipcRenderer.on('sample-success',(event, samples) => {
      var paramsSample = []
      for(var i=1; i<samples.length-1; i++){
        var group = {}
        for(var j=0; j<samples[0].length; j++){
          group[samples[0][j].substring(4,samples[0][j].length-1)] = parseFloat(samples[i][j]).toFixed(2)
        }
        paramsSample.push(group)
      }
      that.$emit('update:paramsSample',paramsSample)

      // nodejs 中的回调线程不靠谱，还是少用为妙
      

      // 更新第一组参数
      that.runningTip.runningNum = 1
      // 等待父组件变量更新
      var prepare = setInterval(()=>{
        if(that.paramsSample.length > 1){
          that.runningTip.total = that.paramsSample.length
          that.currentParams.forEach(param => {
            param.value = that.paramsSample[0][param.name]
          })
          clearInterval(prepare);
        }

        // 计算剩余秒数
        if(that.waterNum > 0 || that.hruNum > 0){
          that.runningTip.remainingTime.totalSeconds = 100 * that.runningTip.total
        }else{
          that.runningTip.remainingTime.totalSeconds = 100 + 7 * (that.runningTip.total-1)
        }
        var totalSeconds = that.runningTip.remainingTime.totalSeconds
        that.runningTip.remainingTime.hour = parseInt(totalSeconds / (60*60))
        totalSeconds = totalSeconds%(60*60)
        that.runningTip.remainingTime.minute = parseInt(totalSeconds / 60)
        totalSeconds = totalSeconds%60
        that.runningTip.remainingTime.second = parseInt(totalSeconds)

      },100)
      

    })
    // 没有成功采样，由于没有保存修改
    ipcRenderer.on('sample-fail',()=>{
      that.$message({
        showClose: true,
        message: that.$t('message.sampleFail'),
        type: 'warning'
      });
    })
    // 没有成功采样，由于其他原因
    ipcRenderer.on('sample-failed',()=>{
      that.$message({
        showClose: true,
        message: that.$t('message.sampleFailed'),
        type: 'error'
      });
    })

    // 运行成功
    ipcRenderer.on('run-success',()=>{
      clearInterval(progress)
      console.log(that.runningTip.runningNum +": "+that.runningTip.percentage)
      that.runningTip.percentage = 100
      setTimeout(()=>{
        // nodejs 的回调函数有些混乱，防止调用多次，增加条件判断
        if(that.runningTip.runningNum == that.currentRun.num && !that.currentRun.finish && that.runningTip.percentage == 100){
          that.currentRun.finish = true
          console.log("------------")
          // 更新所需时间
          if(that.waterNum > 0 || that.hruNum > 0 || that.runningTip.runningNum == 1){
            that.runningTip.remainingTime.totalSeconds -= 100 
          }else{
            that.runningTip.remainingTime.totalSeconds -= 7
          }
          var totalSeconds = that.runningTip.remainingTime.totalSeconds
          that.runningTip.remainingTime.hour = parseInt(totalSeconds / (60*60))
          totalSeconds = totalSeconds%(60*60)
          that.runningTip.remainingTime.minute = parseInt(totalSeconds / 60)
          totalSeconds = totalSeconds%60
          that.runningTip.remainingTime.second = parseInt(totalSeconds)

          if(!that.runningTip.stop){
            // 运行下一组
            if(that.runningTip.runningNum < that.runningTip.total){
              that.runningTip.runningNum += 1

              for(var i=0; i<that.currentParams.length; i++){
                var para = that.currentParams[i]
                para.value = that.paramsSample[that.runningTip.runningNum-1][para.name]
              }

              that.startRunning()

            }else{
              this.$emit('update:activeStep',3)

              // 运行结束，计算敏感性得分
              ipcRenderer.send('compute-SA',that.simSetting.simTargets,that.simSetting.saMethod)
              // 运行结束，读取模拟结果
              ipcRenderer.send('get-simulation-result',that.simSetting.simTargets)
              
              // 运行结束，计算目标函数
              if(that.simSetting.observed){
                ipcRenderer.send('compute-objective',that.simSetting.objective,that.observedInfo)
              }
            }
          }
        }
        
        
      },1000)
    })
    // 运行失败
    ipcRenderer.on('run-failed',()=>{
      that.$message({
        showClose: true,
        message: err + "\n" + "you can try it again.",
        type: 'error'
      });
      
      clearInterval(progress)

    })


    // SA计算成功
    ipcRenderer.on('compute-SA-success',(event,score)=>{
      var scoreSA = {}
      that.simSetting.simTargets.forEach(target => {
        var one = []
        if(that.simSetting.saMethod == 0 || that.simSetting.saMethod == 3){
          // eFAST 和 fast  S1,ST
          for(var i=1; i<score[target][0].length; i++){
            var s ={
              name: score[target][0][i].indexOf('"') != -1 ? score[target][0][i].replace(/"/g,'').substring(3,) : score[target][0][i],
              S1: score[target][1][i].replace(/^(.*\..{4}).*$/,"$1"), // 字符串，保留四位小数，不是四舍五入
              ST: score[target][2][i].replace(/^(.*\..{4}).*$/,"$1")
            }
            one.push(s)
          }
          var a ={
            SI: one
          }
        }else if(that.simSetting.saMethod == 1){
          // morris Mu,μ,横向条形图，Sigma,σ,散点图
          for(var i=1; i<score[target][0].length; i++){
            var s ={
              name: score[target][0][i].indexOf('"') != -1 ? score[target][0][i].replace(/"/g,'').substring(3,) : score[target][0][i],
              Mu: score[target][1][i].replace(/^(.*\..{4}).*$/,"$1"), // 字符串，保留四位小数，不是四舍五入
              Sigma: score[target][2][i].replace(/^(.*\..{4}).*$/,"$1")
            }
            one.push(s)
          }
          var a ={
            SI: one
          }
        }else if(that.simSetting.saMethod == 2){
          // sobol  S1,ST,S2
          var s2 = []
          for(var i=1; i<score[target][0].length; i++){
            var s ={
              name: score[target][0][i].indexOf('"') != -1 ? score[target][0][i].replace(/"/g,'').substring(3,) : score[target][0][i],
              S1: score[target][1][i].replace(/^(.*\..{4}).*$/,"$1"), // 字符串，保留四位小数，不是四舍五入
              ST: score[target][2][i].replace(/^(.*\..{4}).*$/,"$1"),
            }
            var t = []
            for (var j = 1; j < score[target][0].length; j++) {
              if(score[target][j+2][i] == 'nan')
                t.push(0)
              else
                t.push(score[target][j+2][i].replace(/^(.*\..{4}).*$/,"$1"))
            }
            one.push(s)
            s2.push(t)
          }
          var a ={
            SI: one,
            S2: s2
          }
        }
        
        scoreSA[target] = a
      });
      that.$emit('getScoreSA',scoreSA)
    })
    // SA计算失败
    ipcRenderer.on('compute-SA-failed',()=>{
      that.$message({
        showClose: true,
        message: err + "\n" + "Compute SA failed!",
        type: 'error'
      });
    })

    // 成功获取模拟结果
    ipcRenderer.on('simulation-result',(event,result)=>{
      var simResult = {}
      that.simSetting.simTargets.forEach(target => {
        var one = []
        for(var i=0; i<result[target][0].length; i++){
          var res = result[target]
          var max=parseFloat(res[0][i]) 
          var min=max
          for(var j=0; j<res.length; j++){
            var value = parseFloat(res[j][i])
            if(value>max) max=value
            else if(value<min) min=value
          }
          var r ={
            maxValue: max,
            minValue: min
          }
          one.push(r)
        }
        simResult[target] = one
      });
      that.$emit('getSimResult',simResult)
    })
    // 获取模拟结果失败
    ipcRenderer.on('simulation-result-failed',()=>{
      that.$message({
        showClose: true,
        message: err + "\n" + "Get simulation result failed!",
        type: 'error'
      });
    })

    // 计算目标函数成功
    ipcRenderer.on('compute-obj-success',(event,observedInfo)=>{
      that.$emit('getObjScore',observedInfo)
    })
    // 计算目标函数失败
    ipcRenderer.on('compute-obj-failed',()=>{
      that.$message({
        showClose: true,
        message: err + "\n" + "Compute objective function failed!",
        type: 'error'
      });
    })

    // 删除模拟结果成功
    ipcRenderer.on('delete-simResult-success',(event)=>{
      this.$notify({
        title: this.$t('message.cancelSuccess'),
        message: this.$t('message.cancelSuccessMessage'),
        type: 'success'
      });
    })
  },
  data(){
    return{
      currentRun:{
        num: 0,
        finish: false
      },
      
      paramsList:[],

      waterNum:0,
      hruNum:0,
      modelNum:0,

      currentParams:[],
      
    }
  },
}
</script>

<style>
.finish-step-card{
  width: 30%;
  margin: 2% auto;
  text-align: center;
  font-weight: bold;
  font-family:'Times New Roman';
}
#sampleNote{
  background-color: #c3c4cc;
}
#sampleSuccess{
  background-color: #E6A23C;
}
#runNote{
  background-color: #c3c4cc;
}
#runSuccess{
  background-color: #E6A23C;
}
.el-step__title{
  font-family: 'Tahoma';
}
.el-step__title.is-process {
  font-weight: unset;
  color: #C0C4CC;
}
.el-step__head.is-process {
  font-family: 'Tahoma';
  color: #C0C4CC;
}
</style>