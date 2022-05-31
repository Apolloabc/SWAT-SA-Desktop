<template>
  <div>
    <el-tabs v-model="activeTabName" type="border-card" tab-position="bottom"  @tab-click="handleClick">
      <el-tab-pane v-for="(result,key) in allResult" :key="key" :label="result.target" :name="result.target">
        <div :id="result.target"  style="width: 100% ;height:600px;"></div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import echarts from 'echarts'
export default {
  props:['simResult','simSetting', 'observedInfo'],
  methods:{
    initResults(){
      // 基于准备好的dom，初始化echarts实例 
      for(var i=0; i<this.allResult.length; i++){
        var result = this.allResult[i]
        if(result.target == this.activeTabName){

          var dom = document.getElementById(result.target)
          var myChart = echarts.init(dom);
          // 绘制图表
          var option = {
            color:[
              '#438a5e','#96bb7c','#ff5722'
            ],
            title:{
              text:' Result of Simulation',
              subtext: result.target,
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
              data:['min value','max value','observation'],
              bottom:'0',
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
                name:'max value',
                type: 'line',
                // stack: 'value',
                smooth: true,
                areaStyle: {
                  color:'#e3dfc8',
                  opacity:1
                },
                data:result.maxValue
              },
              {
                name:'min value',
                type: 'line',
                // stack: 'value',
                smooth: true,
                areaStyle: {
                    color:'#ffffff',
                    opacity:1
                },
                data:result.minValue
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

    handleClick(tab, event) {
      setTimeout(()=>{
        this.initResults()
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
  mounted() {
    // 准备绘图数据
    this.simSetting.simTargets.forEach(target => {
      var data = {
        target: target,
        maxValue:[],
        minValue:[],
        obs:[]
      }
      if(this.simResult[target] != undefined){
        var simResult = this.objInArr(this.simResult[target])
        for(var i=0; i<simResult.length; i++){
          // if((i+1)%13 != 0){
            var res = simResult[i]
            data.maxValue.push(res.maxValue)
            data.minValue.push(res.minValue)
          // }
        }
      }

      if(this.simSetting.observed){
        for(var i=0; i<this.observedInfo.length; i++){
          if(target == this.observedInfo[i].name && this.observedInfo[i].data!=undefined){
            data.obs = this.observedInfo[i].data
          }
        }
      }
      this.allResult.push(data)
    });

    if(this.allResult.length > 0)
      this.activeTabName = this.allResult[0].target

    // console.log(this.allResult)
    var dates = this.simSetting.simRange
    var startYear = dates[0].split('-')[0]
    var endYear = dates[1].split('-')[0]
    // startYear = 2013
    // endYear = 2014
    for(var i=startYear; i<=endYear; i++){
      for(var j=1; j<=12; j++){
        var str = i+'-'+j
        this.xDate.push(str)
      }
    }
    // console.log(this.xDate)
    // 因为上一段代码执行完，才会生成所有的div，需要留出一个时间让他来创建。神奇的是，timeout设为0都可以
    var that = this
    setTimeout(()=>{
      that.initResults()
    },0)
  },
  data() {
    return {
      allResult:[],
      xDate:[],

      activeTabName:""
    }
  }
}
</script>

<style>

</style>