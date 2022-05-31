<template>
  <div>
    <el-tabs v-model="activeTabName" type="border-card" tab-position="top"  @tab-click="handleClick">
      <el-tab-pane v-for="(score,key) in allScore" :key="key" :label="score.target" :name="score.target">
        <div :id="score.target" class="wholePane"></div>
        <div :id="score.target+2"></div>
        <el-button v-if="scoreSA.length>0" type="text" class="saScoreUrl" @click="openSAScorePath(score.target)">SA_score_{{score.target}}.csv</el-button>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
  import echarts from 'echarts'
  const {shell} = require('electron')
  export default {
    props:['projInfo','scoreSA','simSetting'],
    methods:{
      initScores(){
        // 基于准备好的dom，初始化echarts实例
        for(var i=0; i<this.allScore.length; i++){
          var score = this.allScore[i]
          if(score.target == this.activeTabName){

            if(this.simSetting.saMethod == 0 || this.simSetting.saMethod ==3){
              // eFAST fast S1,ST
              var dom = document.getElementById(score.target)
              dom.className = "wholePane"
              var myChart = echarts.init(dom);
              // 绘制图表
              var option = {
                color:[
                  '#438a5e','#96bb7c'
                ],
                title:{
                  text:' Sensitivity Index',
                  subtext: score.target,
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
                  type: 'scroll',
                  data:['S1','ST'],
                  bottom:'0',
                },
                toolbox: {
                  show : true,
                  feature : {
                    dataView : {readOnly: true},
                    saveAsImage : {show: true}
                  },
                  orient:'vertical',
                  bottom:'0',
                },
                calculable : true,
                xAxis : [
                  {
                    type : 'category',
                    data : score.name
                  }
                ],
                yAxis : [
                  {
                    type : 'value'
                  }
                ],
                series : [
                  {
                      name:'S1',
                      type:'bar',
                      // stack:'effect',
                      data:score.S1
                  },
                  {
                      name:'ST',
                      type:'bar',
                      // stack:'effect',
                      data:score.ST
                  }
                ]
              }
              myChart.setOption(option);
              
              var dom2 = document.getElementById(score.target+2)
              dom2.style.height = '0px'

            }else if(this.simSetting.saMethod == 1){
              // morris Mu,μ,横向条形图,Sigma,σ,散点图
              var dom = document.getElementById(score.target)
              dom.className = "halfPane"
              var myChart1 = echarts.init(dom)
              var option = {
                color:[
                  '#438a5e','#96bb7c'
                ],
                title:{
                  text:' Sensitivity Index (μ*)',
                  subtext: score.target,
                  textStyle: {
                    fontSize: 20
                  },
                  subtextStyle: {
                    fontSize: 16
                  },
                  left:'center'
                },
                grid: {
                  width: '70%',
                  left:'20%',
                },
                tooltip : {
                  trigger: 'axis'
                },
                toolbox: {
                  show : true,
                  feature : {
                    dataView : {readOnly: true},
                    saveAsImage : {show: true}
                  },
                  orient:'vertical',
                  bottom:'0',
                },
                calculable : true,
                xAxis: {
                  name:'μ*',
                  nameTextStyle:{ fontStyle : 'italic',fontWeight : 'bold'},
                  type : 'value',
                },
                yAxis: {
                  type : 'category',                    
                  data : score.name
                },
                series: [
                  {
                    name: 'μ*',
                    type: 'bar',
                    data: score.Mu
                  }
                ]
              }
              myChart1.setOption(option)


              var dom2 = document.getElementById(score.target+2)
              dom2.className = "halfPane"
              var myChart2 = echarts.init(dom2)
              var maxMu = score.Mu[score.Mu.length-1]
              var maxSigma = Math.max(...score.Sigma)
              var max = maxMu>maxSigma?Math.ceil(maxMu):Math.ceil(maxSigma)
              var option = {
                title:{
                  text:' Sensitivity Index (σ/μ*)',
                  subtext: score.target,
                  textStyle: {
                    fontSize: 20
                  },
                  subtextStyle: {
                    fontSize: 16
                  },
                  left:'center'
                },
                grid: {
                  width: '65%',
                  left:'25%',
                },  
                legend: {
                  type: 'scroll',
                  data: score.name,
                  left: '0',
                  bottom : '10%',
                  orient: 'vertical',
                },
                toolbox: {
                  show : true,
                  feature : {
                    dataView : {readOnly: true},
                    saveAsImage : {show: true}
                  },
                  orient:'vertical',
                  bottom:'0',
                },
                calculable : true,
                xAxis: {
                  name:'μ*',
                  nameTextStyle:{ fontStyle : 'italic',fontWeight : 'bold'},
                  type : 'value',
                  max: max
                },
                yAxis: {
                  name:'σ',
                  nameTextStyle:{ fontStyle : 'italic',fontWeight : 'bold'},
                  type : 'value',
                  max: max
                },
                series: this.getSigmaMu(score, max)
              }
              myChart2.setOption(option)

            }else if(this.simSetting.saMethod == 2){
              // sobol  S1,ST,S2
              var dom = document.getElementById(score.target)
              dom.className = "wholePane"
              var myChart = echarts.init(dom);
              // 绘制图表
              var option = {
                color:[
                  '#438a5e','#96bb7c'
                ],
                title:{
                  text:' Sensitivity Index (S1,ST)',
                  subtext: score.target,
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
                  type: 'scroll',
                  data:['S1','ST'],
                  bottom:'0',
                },
                toolbox: {
                  show : true,
                  feature : {
                    dataView : {readOnly: true},
                    saveAsImage : {show: true}
                  },
                  orient:'vertical',
                  bottom:'0',
                },
                calculable : true,
                xAxis : [
                  {
                    type : 'category',
                    data : score.name
                  }
                ],
                yAxis : [
                  {
                    type : 'value'
                  }
                ],
                series : [
                  {
                      name:'S1',
                      type:'bar',
                      data:score.S1
                  },
                  {
                      name:'ST',
                      type:'bar',
                      data:score.ST
                  }
                ]
              }
              myChart.setOption(option);

              var dom2 = document.getElementById(score.target+2)
              dom2.className = "wholePane"
              var myChart2 = echarts.init(dom2);
              // 绘制图表
              var option = {
                title:{
                  text:' Sensitivity Index (S2)',
                  subtext: score.target,
                  textStyle: {
                    fontSize: 20
                  },
                  subtextStyle: {
                    fontSize: 16
                  },
                  left:'center'
                },
                toolbox: {
                  show : true,
                  feature : {
                    dataView : {readOnly: true},
                    saveAsImage : {show: true}
                  },
                  orient:'vertical',
                  bottom:'0',
                },
                tooltip: {
                    trigger:'item',
                    formatter: '{b}'
                },
                animation: false,
                grid: {
                  height: '75%',
                  width: '80%',
                  top: '14%',
                  right: "8%"
                },
                xAxis: {
                  type: 'category',
                  position: 'top',
                  data: score.name,
                  // splitArea: {
                  //   show: true,
                  //   interval: 0
                  // }
                },
                yAxis: {
                  type: 'category',
                  data: score.name,
                  inverse: 'true',
                  // splitArea: {
                  //   show: true,
                  //   interval: 0
                  // }
                },
                visualMap: {
                  min: -1,
                  max: 1,
                  calculable: true,
                  orient: 'horizontal',
                  left: 'center',
                  bottom: '1%',
                  type: 'continuous',
                  color:['#527318','#fff','#dfdfdf']
                },
                series: [{
                  type: 'heatmap',
                  data: score.S2,
                  label: {
                    show: true,
                    color:'#000'
                  },
                  emphasis: {
                    itemStyle: {
                      shadowBlur: 10,
                      shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                  }
                }]
              }
              myChart2.setOption(option);
            }

            
          }
        }
      },


      handleClick(tab, event) {
        setTimeout(()=>{
          this.initScores()
        },0)
      },

      sortByMu(score){
        var len = score.Mu.length;
        var minIndex, temp;
        for(var i = 0; i < len - 1; i++) {
            minIndex = i;
            for(var j = i + 1; j < len; j++) {
                if(parseFloat(score.Mu[j]) < parseFloat(score.Mu[minIndex])) {     // 寻找最小的数
                    minIndex = j;                 // 将最小数的索引保存
                }
            }
            temp = score.Mu[i];
            score.Mu[i] = score.Mu[minIndex];
            score.Mu[minIndex] = temp;

            temp = score.name[i];
            score.name[i] = score.name[minIndex];
            score.name[minIndex] = temp;

            temp = score.Sigma[i];
            score.Sigma[i] = score.Sigma[minIndex];
            score.Sigma[minIndex] = temp;
        }
        return score;
      },

      getSigmaMu(score, max){
        var series = []
        for (let i = 0; i < score.name.length; i++) {
          var data ={
            name: score.name[i],
            type: 'scatter',
            symbolSize: 20,
            symbol: 'diamond',
            data: [[score.Mu[i],score.Sigma[i]]]
          }
          series.push(data)
        }
        if(series.length != 0){
          series[0].markLine={
            symbol:"none",
            lineStyle:{
              type : "dotted"
            },
            data: [
              [
                {
                    name: "σ/μ*=1",
                    coord: [0, 0]
                },
                {
                    coord: [max,max]
                }
              ],
              [
                {
                    name: "σ/μ*=0.5",
                    coord: [0, 0]
                },
                {
                    coord: [max,max/2]
                }
              ],
              [
                {
                    name: "σ/μ*=0.1",
                    coord: [0, 0]
                },
                {
                    coord: [max,max/10]
                }
              ],
            ]
          }
        }
       
        return series;
      },

      openSAScorePath(targt){
        var str = this.projInfo.path + "\\" + this.projInfo.name + "\\SA_score_"+targt+".csv"
        shell.showItemInFolder(str)
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

      if(this.simSetting.saMethod == 0 || this.simSetting.saMethod ==3){
        // eFAST fast S1,ST
        // 准备绘图数据
        this.simSetting.simTargets.forEach(target => {
          var data = {
            target: target,
            name: [],
            S1: [],
            ST: []
          }
          if(this.scoreSA[target] != undefined){
            var scoreSA = this.scoreSA[target].SI
            for(var i=0; i<scoreSA.length; i++){
              var score = scoreSA[i]
              data.name.push(score.name)
              data.S1.push(score.S1)
              data.ST.push(score.ST)
            }
          }
          this.allScore.push(data)
        });

      }else if(this.simSetting.saMethod == 1){
        // morris Mu,μ,横向条形图,Sigma,σ,散点图
        // 准备绘图数据
        this.simSetting.simTargets.forEach(target => {
          var data = {
            target: target,
            name: [],
            Mu: [],
            Sigma: []
          }
          if(this.scoreSA[target] != undefined){
            var scoreSA = this.scoreSA[target].SI
            for(var i=0; i<scoreSA.length; i++){
              var score = scoreSA[i]
              data.name.push(score.name)
              data.Mu.push(score.Mu)
              data.Sigma.push(score.Sigma)
            }
          }
          this.allScore.push(this.sortByMu(data))
        });

      }else if(this.simSetting.saMethod == 2){
        // sobol  S1,ST,S2
        // 准备绘图数据
        this.simSetting.simTargets.forEach(target => {
          var data = {
            target: target,
            name: [],
            S1: [],
            ST: [],
            S2: []
          }
          if(this.scoreSA[target] != undefined){
            var scoreSA = this.scoreSA[target]
            for(var i=0; i<scoreSA.SI.length; i++){
              var score = scoreSA.SI[i]
              data.name.push(score.name)
              data.S1.push(score.S1)
              data.ST.push(score.ST)
            }
            var s2 = []
            for(var j=0; j<scoreSA.S2[0].length; j++){
              var p = scoreSA.S2[j]
              for (let k = 0; k < p.length; k++) {
                s2.push([j,k,p[k]])
              }
            }
            data.S2 = s2
          }
          this.allScore.push(data)
        });
      }
      if(this.allScore.length > 0)
        this.activeTabName = this.allScore[0].target

      // 因为上一段代码执行完，才会生成所有的div，需要留出一个时间让他来创建。神奇的是，timeout设为0都可以
      var that = this
      setTimeout(()=>{
        that.initScores()
      },0)
    },
    data() {
      return {
        allScore:[],

        activeTabName:""
      }
    }
  }
</script>

<style scoped>
  .halfPane{
    width: 49%;
    height: 600px;
    display: inline-block;
    border: 1px dotted #438a5e;
  }
  .wholePane{
    width: 100%;
    height: 600px;
    margin: 10px 0;
    border: 1px dotted #438a5e;
  }
  
  .mdbUrl{   padding:0; float:right; margin:1% 5%;  color:#000; } 
</style>
