<template>
  <div>
    <div style="width: 80%; float: left">
      <el-table
        :data="currentParams"
        :span-method="objectSpanMethod"
        class="paramTable">
        <el-table-column header-align="center">
          <template slot="header">
            <span>{{$t('message.singleTitle')}}</span>
            <!-- <el-cascader  style="float:right;width:120px" size="small"
              v-model="selectedOption" :options="paramsOptions" :props="{ expandTrigger: 'hover' }"
              @change="handleChangeSelect"></el-cascader> -->
          </template>
          <el-table-column
            prop="submodel"
            :label="$t('message.submodelColumn')"
            width="120">
          </el-table-column>
          <el-table-column
            prop="name"
            :label="$t('message.paramColumn')"
            width="100">
          </el-table-column>
          <el-table-column prop="desc" :label="$t('message.descColumn')">
          </el-table-column>
          <el-table-column
            prop="type"
            :label="$t('message.operateType')"
            width="115">
            <template slot-scope="scope">
              <el-select v-model="scope.row.type.selected" size="small" >
                <el-option
                  v-for="item in scope.row.type.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"  style="font-family:'Times New Roman';">
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column
            prop="value"
            :label="$t('message.valueColumn')"
            width="115">
            <template slot-scope="scope">
              <el-input-number v-if="scope.row.type.selected =='a__'" v-model="scope.row.type.avalue"  size="small" :controls="false"
                @change="(currentValue, oldValue) => validateSpace(currentValue, oldValue, scope.row.name)"
                :precision="3" :step="0.1" controls-position="right" style="width:93px">
              </el-input-number>
              <el-input-number v-else-if="scope.row.type.selected =='r__'" v-model="scope.row.type.rvalue"  size="small" :controls="false"
                @change="(currentValue, oldValue) => validateSpace(currentValue, oldValue, scope.row.name)"
                :precision="3" :step="0.1" controls-position="right" style="width:93px" >
              </el-input-number>
              <el-input-number v-else v-model="scope.row.type.vvalue"  size="small" :controls="false"
                @change="(currentValue, oldValue) => validateSpace(currentValue, oldValue, scope.row.name)"
                :precision="3" :step="0.1" controls-position="right"  style="width:93px">
              </el-input-number>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table>

        
      <!-- 结果展示 -->
      <!-- 折线图 v-if="pieResult.landuse != undefined" -->
      <el-tabs  v-model="activeLineTab" type="border-card" tab-position="bottom" class="singleResult" 
       @tab-click="handleLineClick" v-if="pieResult.landuse != undefined">
        <el-tab-pane v-for="(x,key) in simSetting.simTargets" :key="key" :label="x" :name="x">
          <div :id="'res_'+x"  style="width: 100% ;height:400px;"></div>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 饼状图 -->
      <el-tabs  v-model="activePieTab" type="border-card" tab-position="bottom" class="singleResult" 
       @tab-click="handlePieClick" v-if="pieResult.landuse != undefined">
        <el-tab-pane v-for="(x,key) in tntp" :key="key" :label="x" :name="x">
          <div :id="'pie_'+x"  style="width: 100% ;height:400px;"></div>
        </el-tab-pane>
      </el-tabs>
      
    </div>
    <div style="width: 20%; float: right; text-align: center">
      <p style="padding: 10px;margin:0 0 5px; background: #F5F7FA;">{{$t('message.resultTitle')}}</p>

      <el-button
        type="primary" plain size="medium " 
        style="margin-top: 1%; font-family: 'Tahoma'"
        @click="startSingleRun">
        {{$t('message.startSingle')}}
      </el-button>
      <template  v-for="(target,key) in singleCalibration" >
        <el-divider :key="key" style="width: 90%;margin: 24px auto;">({{target.name}})</el-divider>
        <el-button :key="target.name" type="text" class="resultFile" @click="openResultPath(target.name)">single_sim_result_{{target.name}}.dat</el-button>
        <!-- <p :key="target.name">single_sim_result_{{target.name}}.dat</p> -->
        <!-- NSE -->
        <p v-if="target.NSE != undefined" :key="target.NSE"> NSE: {{target.NSE}}</p>
        <!-- RSquared -->
        <p v-if="target.RSquared != undefined" :key="target.RSquared"> RSquared: {{target.RSquared}}</p>
        <!-- PBIAS -->
        <p v-if="target.PBIAS != undefined" :key="target.PBIAS"> PBIAS: {{target.PBIAS}}</p>
        <!-- abandoned -->
        <!-- RMSE -->
        <p v-if="target.RMSE != undefined" :key="target.RMSE"> RMSE: {{target.RMSE}}</p>
        <!-- MAPE -->
        <p v-if="target.MAPE != undefined" :key="target.MAPE"> MAPE: {{target.MAPE}}</p>
      </template>
    </div>

  </div>
</template>

<script> 
import echarts from 'echarts'
const {ipcRenderer} = require('electron')
const {shell} = require('electron')
var loading
export default {
  props: ["projInfo","paramsSum","simSetting","observedInfo","calibrationResult",],
  methods: {
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      if (columnIndex === 0) {
        if (this.waterNum > 0 && this.waterNum - rowIndex === this.waterNum) {
          return {
            rowspan: this.waterNum,
            colspan: 1,
          };
        } else if (
          this.hruNum > 0 &&
          this.hruNum + this.waterNum - rowIndex === this.hruNum
        ) {
          return {
            rowspan: this.hruNum,
            colspan: 1,
          };
        } else if (this.paramsSum.length - rowIndex == this.modelNum) {
          return {
            rowspan: this.modelNum,
            colspan: 1,
          };
        } else {
          return {
            rowspan: 0,
            colspan: 0,
          };
        }
      }
    },

    //验证用户置空输入框的情况
    validateSpace(newValue,oldValue,name){
      if(newValue == undefined){
        this.$message({
          message: name + ' is empty! The value before modification will be used.',
          type: 'warning'
        });
        for(var i=0; i<this.currentParams.length; i++){
          if(this.currentParams[i].name == name){
            var param = this.currentParams[i]
            if(param.type.selected == 'v__'){
              param.type.vvalue = oldValue
            }else if(param.type.selected == 'a__'){
              param.type.avalue = oldValue
            }else{
              param.type.rvalue = oldValue
            }
            break
          }
        }
      }
    },

    // 开始单次运行
    startSingleRun() { 

      this.$confirm( this.projInfo.type==1?this.$t('message.startSingleMessage'):this.$t('message.startSingleMessage2'), this.$t('message.startSingleTitle'), {
        confirmButtonText: this.$t('message.selectConfirm'),
        cancelButtonText: this.$t('message.selectCancel'),
        type: 'info ',
        center: true
      }).then(() => {
        // 添加MinStream、MinLU、MinSoil、MinSlope、IntSlope，默认值 10000、20、20、20 和 50
        var MinStream=false,MinLU=false,MinSoil=false,MinSlope=false,IntSlope=false
        var singleParams = []
        for(var i=0; i<this.currentParams.length; i++){
          var p = this.currentParams[i]
          singleParams.push(p)
          if(p.name == 'MinStream'){
              MinStream = true
          }else if(p.name == 'MinLU'){
              MinLU = true
          }else if(p.name == 'MinSoil'){
              MinSoil = true
          }else if(p.name == 'MinSlope'){
              MinSlope = true
          }else if(p.name == 'IntSlope'){
              IntSlope = true
          }
        }
        // 根据项目类型，判断是否添加以下五个参数 1 raw data 添加；0 TxtInOut 不添加 
        if(this.projInfo.type==1){
          if(!MinStream){
            singleParams.push({name:'MinStream',type:{selected:"v__",vvalue:10000}})
          }
          if(!MinLU){
            singleParams.push({name:'MinLU',type:{selected:"v__",vvalue:20}})
          }
          if(!MinSoil){
            singleParams.push({name:'MinSoil',type:{selected:"v__",vvalue:20}})
          }
          if(!MinSlope){
            singleParams.push({name:'MinSlope',type:{selected:"v__",vvalue:20}})
          }
          if(!IntSlope){
            singleParams.push({name:'IntSlope',type:{selected:"v__",vvalue:50}})
          }
        }

        
        loading = this.$loading({
          lock: true,
          text: "Running",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 根据项目类型，判断是否运行数据前处理程序 1 raw data 运行；0 TxtInOut 不运行
        var preExe = this.projInfo.type
        ipcRenderer.send('start-single-run',singleParams,preExe)

      }).catch(()=>{

      })

    },
  
    // 打开结果目录
    openResultPath(name){
      var str = this.projInfo.path + "\\" + this.projInfo.name + "\\" + "single_sim_result_" + name+".dat"
      shell.showItemInFolder(str)
    },

    // 生成折线图
    initSimResults(){
      for(var i=0; i<this.singleSimResult.length; i++){
        var result = this.singleSimResult[i]

        if(result.target == this.activeLineTab){
          var dom = document.getElementById('res_'+result.target)
          var myChart = echarts.init(dom);
           // 绘制图表
          var option = {
            color:[
              '#438a5e','#96bb7c','#ff5722'
            ],
            title:{
              text:'Result of Simulation',
              subtext:result.target,
              textStyle: {
                fontSize: 20
              },
              subtextStyle: {
                fontSize: 16
              },
              left:'center'
            },
            tooltip : {
              trigger: 'axis'
            },
            legend: {
              data:['simulation','observation'],
              bottom: 0
            },
            toolbox: {
              show : true,
              feature : {
                dataZoom: {
                  yAxisIndex: "none"
                },
                dataView: {
                  readOnly: true
                },
                saveAsImage : {show: true}
              },
              orient:'vertical',
              bottom:'0',
            },
            calculable : true,
            
            xAxis : [
              {
                type : 'category',
                boundaryGap: false,
                data : this.xDate
              }
            ],
            yAxis : [
              {
                type : 'value'
              }
            ],
            series : [
              {
                name:'simulation',
                type: 'line',
                smooth: true,
                data:result.sim
              },
              {
                name:'observation',
                type: 'line',
                smooth: true,
                data:result.obs
              }
            ]
          }
          myChart.setOption(option);
        }
      }
    },
    handleLineClick(tab, event) {
      setTimeout(()=>{
        this.initSimResults()
      },0)
    },

    // 生成饼状图
    initPieResults(){
      // 基于准备好的dom，初始化echarts实例 
      for(var i=0; i<this.tntp.length; i++){
        var x = this.tntp[i]
        if(x == this.activePieTab){
          var dom = document.getElementById('pie_'+x)
          var myChart = echarts.init(dom);
          // 绘制图表
          var option = {
            title:{
              text:'Contribution of landuse to Nutrients - '+x,
              // subtext: x,
              textStyle: {
                fontSize: 20
              },
              subtextStyle: {
                fontSize: 16
              },
              left:'center'
            },
            tooltip : {         
              trigger: 'item',         
              formatter: '{b} : {c} ({d}%)'
            },
            legend: {
              data:this.pieResult.landuse,
              left: 'center',
              bottom:0,       
            },
            toolbox: {
              show : true,
              feature : {
                saveAsImage : {show: true}
              },
              orient:'vertical',
              bottom:'0',
            },
            series : [
              {
                type: 'pie',
                radius: '65%',
                center: ['50%', '55%'],
                selectedMode: 'single',
                data: this.pieResult[x],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
              }
            ]
          }
          myChart.setOption(option);
          
        }
      }
     
    },
    handlePieClick(tab, event) {
      setTimeout(()=>{
        this.initPieResults()
      },0)
    },
  
    // 对象 装进 数组
    objInArr(obj){
      var arr = []
      if(obj == undefined){
        return arr
      }else if(obj.length == undefined || typeof(obj) == "string"){
        arr.push(obj)
        return arr
      }else{
        return obj
      }
    }
  },
  mounted(){

    // 统计所选参数中各类型数量，生成表头
    for (var i = 0; i < this.paramsSum.length; i++) {
      var param = this.paramsSum[i];
      switch (param.submodel) {
        case "Watershed Delineation":
          this.waterNum++;
          break;
        case "HRU Creation":
          this.hruNum++;
          break;
        case "SWAT Execution":
          this.modelNum++;
          break;
      }
      
      // currentParams 需要增加一个属性
      if(param.type.selected == 'v__'){
        param.type.vvalue = (param.type.vmin + param.type.vmax)/2
      }else if(param.type.selected == 'a__'){
        param.type.avalue = (param.type.amin + param.type.amax)/2
      }else{
        param.type.rvalue = (param.type.rmin + param.type.rmax)/2
      }
      
      this.currentParams.push(param);
    }
    
    // X轴
    var dates = this.simSetting.simRange
    var startYear = dates[0].split('-')[0]
    var endYear = dates[1].split('-')[0]
    for(var i=startYear; i<=endYear; i++){
      for(var j=1; j<=12; j++){
        var str = i+'-'+j
        this.xDate.push(str)
      }
    }

    var that = this
    // 单次运行成功
    ipcRenderer.on('single-run-success',()=>{
        
      loading.close();
      // 运行成功

      // 获取模拟结果，包括两个，各个target的模拟结果和土地利用对于TN，TP的贡献率
      ipcRenderer.send('get-single-sim-result',that.simSetting.simTargets)

      // 情况一：没有选择观测数据，直接提取
      // 选择outlet是必须的，另外需要上传一个水文站点的点数据
      if(!that.simSetting.observed){
        that.singleCalibration = []
        for(var i=0; i<that.simSetting.simTargets.length; i++){
            var targ = that.simSetting.simTargets[i]
            var result = {
                name:targ
            }
            that.singleCalibration.push(result)
        }
        console.log(that.singleCalibration)
      }
      // 情况二：选择了观测数据
      if(that.simSetting.observed){
        // 调用计算目标函数脚本
        ipcRenderer.send('single-compute-objective',that.simSetting.objective,that.observedInfo)
      } 
    })

    // 单次运行失败
    ipcRenderer.on('single-run-failed',(err)=>{
      that.$message({
        showClose: true,
        message: err + "\n" + "you can try it again.",
        type: 'error'
      });
      loading.close();
    })

    // 单次运行被拒绝
    ipcRenderer.on('single-run-denied',()=>{
      
      loading.close();

      that.$message({
        showClose: true,
        message: that.$t('message.sampleFail'),
        type: 'warning'
      });
    })

    // 成功获取单次模拟结果
    ipcRenderer.on('single-simulation-result',(event,singleSimResult)=>{
      // 初始化折线数据
      for(var i=0; i<that.simSetting.simTargets.length; i++){
        var target = that.simSetting.simTargets[i]
        var data = {
          target: target,
          sim:[],
          obs:[]
        }
        if(singleSimResult[target] != undefined){
          data.sim = singleSimResult[target]
        }

        if(that.simSetting.observed){
          for(var j=0; j<that.observedInfo.length; j++){
            if(target == that.observedInfo[j].name && that.observedInfo[j].data!=undefined){
              data.obs = that.observedInfo[j].data
            }
          }
        }
        that.singleSimResult.push(data)
      }
      that.activeLineTab = that.singleSimResult[0].target
      setTimeout(()=>{
        that.initSimResults()
      },0)
      // 初始化饼状数据
      var pie = {
        landuse:singleSimResult.pieResult.landuse,
        TN:[],TP:[],
      }
      for(var i=0; i<singleSimResult.pieResult.landuse.length; i++){
        var la = singleSimResult.pieResult.landuse[i]
        var tn = {
          name: la,
          value: singleSimResult.pieResult.TN[i]
        }
        var tp = {
          name: la,
          value: singleSimResult.pieResult.TP[i]
        }
        pie.TN.push(tn)
        pie.TP.push(tp)
      }
      that.pieResult = pie  
      setTimeout(()=>{
        that.initPieResults()
      },0)   
    })

    // 单次运行目标函数 计算成功
    ipcRenderer.on('single-compute-obj-success',(event,objResult)=>{       
      // 计算每个Target的每个目标函数的最佳参数组
      that.singleCalibration = []
      for(var i=0; i<objResult.length; i++){
        var res = objResult[i]
        // 遍历每一个目标函数，获得得分
        var result = {
            name:res.name
        }
        for (const obj in res.obj) {
            if (res.obj.hasOwnProperty(obj)) {
                const score = (res.obj[obj].replace(/[\r\n]/g,"")).replace(/^(.*\..{4}).*$/,"$1") // 字符串，保留四位小数，不是四舍五入
                result[obj]=score
            }
        }
        that.singleCalibration.push(result)
      }
      console.log(that.singleCalibration)

    })

    
  },

  data() {
    return {
    //   paramsList: [],

      waterNum: 0,
      hruNum: 0,
      modelNum: 0,

      currentParams: [],

      singleCalibration:[],

      xDate:[],
      activeLineTab:"",
      activePieTab:"TN",
      tntp:['TN','TP'],

      singleSimResult:[],
      pieResult:{
        // landuse:['GRAS',	'SHRB',	'CRDY',	'FOEN',	'SAVA',	'FOMI' ],
        // TN:[
        //   {value: 34328.352, name: 'GRAS'},
        //   {value: 649.968, name: 'SHRB'},
        //   {value: 186.156, name: 'CRDY'},
        //   {value: 294.825, name: 'FOEN'},
        //   {value: 589.659, name: 'SAVA'},
        //   {value: 381.193, name: 'FOMI'},
        // ],
        // TP:[
        //   {value: 7225.323, name: 'GRAS'},
        //   {value: 149.082, name: 'SHRB'},
        //   {value: 33.917, name: 'CRDY'},
        //   {value: 61.55, name: 'FOEN'},
        //   {value: 113.2, name: 'SAVA'},
        //   {value: 70.169, name: 'FOMI'},
        // ]
      }
      // selectedOption:[],
      // paramsOptions:[],

    }
  }
}
</script>

<style scoped>
.resultFile{
  padding:0;
  color:#000;
}
.resultFile:hover{
  color: #66b1ff;
}
.singleResult{
  width: 95%;
  margin: 10px auto;
}
</style>